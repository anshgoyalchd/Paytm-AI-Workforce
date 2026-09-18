from datetime import datetime
from typing import Optional, List
from backend.app.schemas.schemas import ActionType, Channel, PolicyEvaluationResult
from backend.app.models.models import CollectionCase, AgentSetting, Action
from backend.app.policies.rules import (
    BasePolicyRule,
    AgentStatusRule,
    DisputeProtectionRule,
    ContactHoursRule,
    FrequencyLimitRule,
    ChannelCooldownRule,
    SettlementAuthorityRule,
)


class PolicyEngine:
    """
    Deterministic Policy Engine acting as the hard authorization boundary
    between AI LLM proposals and real-world execution.
    """

    def __init__(self, rules: Optional[List[BasePolicyRule]] = None):
        self.rules = rules or [
            AgentStatusRule(),
            DisputeProtectionRule(),
            ContactHoursRule(),
            FrequencyLimitRule(),
            ChannelCooldownRule(),
            SettlementAuthorityRule(),
        ]

    def evaluate(
        self,
        case: CollectionCase,
        action_type: ActionType,
        channel: Optional[Channel] = None,
        recent_actions: Optional[List[Action]] = None,
        settings: Optional[AgentSetting] = None,
        discount_pct: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PolicyEvaluationResult:
        # Default settings fallback if not provided
        settings = settings or AgentSetting(
            merchant_id=case.merchant_id,
            agent_status="ACTIVE",
            contact_start_hour=9,
            contact_end_hour=19,
            max_contact_attempts=2,
            min_hours_between_contacts=4,
            auto_voice_enabled=True,
            auto_whatsapp_enabled=True,
        )
        recent_actions = recent_actions or []

        # Sequential evaluation of all deterministic rules
        for rule in self.rules:
            result = rule.evaluate(
                case=case,
                action_type=action_type,
                channel=channel,
                recent_actions=recent_actions,
                settings=settings,
                discount_pct=discount_pct,
                now=now,
            )
            if not result.is_allowed:
                # If blocked, sanitize proposed action to WAIT with backoff
                result.sanitized_action = ActionType.WAIT
                return result

            # If human approval is flagged, keep note and continue checking other rules
            if result.requires_human_approval:
                return result

        return PolicyEvaluationResult(
            is_allowed=True,
            policy_name="all_rules_passed",
            reason="All deterministic guardrail and compliance policies satisfied.",
            requires_human_approval=False,
            sanitized_action=action_type,
        )


policy_engine = PolicyEngine()
