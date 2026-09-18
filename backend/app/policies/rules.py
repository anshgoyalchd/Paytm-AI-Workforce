from datetime import datetime, timezone, timedelta
from typing import Optional, List
from zoneinfo import ZoneInfo
from backend.app.schemas.schemas import ActionType, Channel, PolicyEvaluationResult
from backend.app.models.models import CollectionCase, AgentSetting, Action


def make_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class BasePolicyRule:
    name: str = "base_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        raise NotImplementedError


class AgentStatusRule(BasePolicyRule):
    name: str = "agent_status_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        if settings.agent_status == "PAUSED":
            return PolicyEvaluationResult(
                is_allowed=False,
                policy_name=self.name,
                reason="Workforce agent is currently PAUSED by operator. Outbound actions blocked.",
                requires_human_approval=False,
            )

        if settings.agent_status == "SUPERVISED":
            return PolicyEvaluationResult(
                is_allowed=True,
                policy_name=self.name,
                reason="Workforce agent is in SUPERVISED mode. Action permitted but requires operator review.",
                requires_human_approval=True,
            )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason="Agent is active in autonomous mode.",
        )


class ContactHoursRule(BasePolicyRule):
    name: str = "contact_hours_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        # Passive / internal actions are always allowed
        if action_type in (ActionType.WAIT, ActionType.ESCALATE):
            return PolicyEvaluationResult(is_allowed=True, policy_name=self.name, reason="Passive action exempt from contact hours.")

        current_time = now or datetime.now(timezone.utc)
        # Avoid triggering async lazy load on case.merchant
        tz_str = "Asia/Kolkata"
        try:
            local_tz = ZoneInfo(tz_str)
        except Exception:
            local_tz = ZoneInfo("Asia/Kolkata")

        local_dt = current_time.astimezone(local_tz)
        current_hour = local_dt.hour

        start_hour = settings.contact_start_hour or 9
        end_hour = settings.contact_end_hour or 19

        if current_hour < start_hour or current_hour >= end_hour:
            # Calculate hours until start_hour next morning
            if current_hour < start_hour:
                wait_hours = start_hour - current_hour
            else:
                wait_hours = (24 - current_hour) + start_hour

            return PolicyEvaluationResult(
                is_allowed=False,
                policy_name=self.name,
                reason=f"Current time {local_dt.strftime('%H:%M')} is outside allowable contact hours ({start_hour:02d}:00 - {end_hour:02d}:00 {tz_str}).",
                suggested_backoff_hours=wait_hours,
            )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason=f"Contact time is within legal window ({start_hour:02d}:00 - {end_hour:02d}:00).",
        )


class FrequencyLimitRule(BasePolicyRule):
    name: str = "frequency_limit_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        if action_type in (ActionType.WAIT, ActionType.ESCALATE):
            return PolicyEvaluationResult(is_allowed=True, policy_name=self.name, reason="Exempt from frequency limits.")

        current_time = now or datetime.now(timezone.utc)
        one_day_ago = current_time - timedelta(days=1)
        seven_days_ago = current_time - timedelta(days=7)

        # Count completed/executed actions in past 24 hours
        past_24h_actions = [
            a for a in recent_actions
            if a.requested_at and make_aware(a.requested_at) >= one_day_ago and a.action_type in ("TEXT", "CALL")
        ]

        max_per_day = settings.max_contact_attempts or 2
        if len(past_24h_actions) >= max_per_day:
            return PolicyEvaluationResult(
                is_allowed=False,
                policy_name=self.name,
                reason=f"Customer has already received {len(past_24h_actions)} contacts in the past 24h (Max allowed: {max_per_day}).",
                suggested_backoff_hours=12,
            )

        # Check weekly voice call limit (max 4 per week)
        if action_type == ActionType.CALL or channel == Channel.VOICE:
            past_week_calls = [
                a for a in recent_actions
                if a.requested_at and make_aware(a.requested_at) >= seven_days_ago and (a.action_type == "CALL" or a.channel == "VOICE")
            ]
            if len(past_week_calls) >= 4:
                return PolicyEvaluationResult(
                    is_allowed=False,
                    policy_name=self.name,
                    reason=f"Customer has received {len(past_week_calls)} calls in the past 7 days (Weekly limit: 4).",
                    suggested_backoff_hours=24,
                )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason="Contact frequency within allowable limits.",
        )


class ChannelCooldownRule(BasePolicyRule):
    name: str = "channel_cooldown_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        if action_type in (ActionType.WAIT, ActionType.ESCALATE):
            return PolicyEvaluationResult(is_allowed=True, policy_name=self.name, reason="Exempt from cooldown.")

        current_time = now or datetime.now(timezone.utc)
        min_cooldown_hours = settings.min_hours_between_contacts or 4
        cooldown_delta = timedelta(hours=min_cooldown_hours)

        outbound_actions = [
            a for a in recent_actions
            if a.requested_at and a.action_type in ("TEXT", "CALL")
        ]

        if outbound_actions:
            latest_action = max(outbound_actions, key=lambda a: make_aware(a.requested_at))
            elapsed = current_time - make_aware(latest_action.requested_at)
            if elapsed < cooldown_delta:
                remaining_hours = int((cooldown_delta - elapsed).total_seconds() // 3600) + 1
                return PolicyEvaluationResult(
                    is_allowed=False,
                    policy_name=self.name,
                    reason=f"Minimum cooldown of {min_cooldown_hours}h required between contacts. Last contact was {elapsed.seconds // 3600}h ago.",
                    suggested_backoff_hours=remaining_hours,
                )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason="Channel cooldown check passed.",
        )


class DisputeProtectionRule(BasePolicyRule):
    name: str = "dispute_protection_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        if case.status == "DISPUTED":
            if action_type in (ActionType.TEXT, ActionType.CALL):
                return PolicyEvaluationResult(
                    is_allowed=False,
                    policy_name=self.name,
                    reason="Case is under DISPUTE. Automated collection outreach is legally frozen pending dispute resolution.",
                    requires_human_approval=True,
                )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason="Case not under active dispute.",
        )


class SettlementAuthorityRule(BasePolicyRule):
    name: str = "settlement_authority_rule"

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel],
        recent_actions: List[Action],
        settings: AgentSetting,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        if discount_pct is not None and discount_pct > 0:
            max_allowed = 10.0  # 10% autonomous cap
            if discount_pct > max_allowed:
                return PolicyEvaluationResult(
                    is_allowed=False,
                    policy_name=self.name,
                    reason=f"Proposed discount of {discount_pct}% exceeds autonomous policy cap ({max_allowed}%). Requires manager authorization.",
                    requires_human_approval=True,
                )

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name=self.name,
            reason="Settlement discount within autonomous limits.",
        )
