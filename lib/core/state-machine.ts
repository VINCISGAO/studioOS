export interface StateMachine<TState extends string, TEvent extends string> {
  canTransition(current: TState, event: TEvent): boolean;
  transition(current: TState, event: TEvent): TState;
  getAvailableEvents(current: TState): TEvent[];
}

type TransitionTable<TState extends string, TEvent extends string> = Record<
  TEvent,
  { from: TState[]; to: TState }
>;

export function createStateMachine<TState extends string, TEvent extends string>(
  table: TransitionTable<TState, TEvent>
): StateMachine<TState, TEvent> {
  return {
    canTransition(current, event) {
      const rule = table[event];
      return Boolean(rule?.from.includes(current));
    },

    transition(current, event) {
      const rule = table[event];
      if (!rule || !rule.from.includes(current)) {
        throw new Error(`Invalid transition: ${current} + ${event}`);
      }
      return rule.to;
    },

    getAvailableEvents(current) {
      return (Object.entries(table) as [TEvent, { from: TState[]; to: TState }][])
        .filter(([, rule]) => rule.from.includes(current))
        .map(([event]) => event);
    }
  };
}

export type TransitionResult<TState extends string> =
  | { ok: true; status: TState }
  | { ok: false; code: "INVALID_TRANSITION"; message: string };

export function safeTransition<TState extends string, TEvent extends string>(
  machine: StateMachine<TState, TEvent>,
  current: TState,
  event: TEvent
): TransitionResult<TState> {
  if (!machine.canTransition(current, event)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Cannot transition from ${current} via ${event}`
    };
  }
  return { ok: true, status: machine.transition(current, event) };
}
