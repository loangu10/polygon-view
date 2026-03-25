CREATE INDEX IF NOT EXISTS idx_sbp_signal_poly_window
    ON strategy_bet_performance (collected_at_poly DESC)
    WHERE is_bet_signal = TRUE;

CREATE INDEX IF NOT EXISTS idx_sbp_signal_event_fallback_window
    ON strategy_bet_performance (collected_at_event DESC)
    WHERE is_bet_signal = TRUE
      AND collected_at_poly IS NULL;

CREATE INDEX IF NOT EXISTS idx_sbp_live_recent_poly
    ON strategy_bet_performance (collected_at_poly DESC)
    WHERE is_bet_signal = TRUE
      AND (live_bet_attempted = TRUE OR live_bet_placed = TRUE);

CREATE INDEX IF NOT EXISTS idx_sbp_live_recent_event_fallback
    ON strategy_bet_performance (collected_at_event DESC)
    WHERE is_bet_signal = TRUE
      AND collected_at_poly IS NULL
      AND (live_bet_attempted = TRUE OR live_bet_placed = TRUE);

CREATE INDEX IF NOT EXISTS idx_sbp_live_results_poly
    ON strategy_bet_performance (collected_at_poly DESC)
    WHERE is_bet_signal = TRUE
      AND live_bet_placed = TRUE
      AND live_bet_settled = TRUE;

CREATE INDEX IF NOT EXISTS idx_sbp_live_results_event_fallback
    ON strategy_bet_performance (collected_at_event DESC)
    WHERE is_bet_signal = TRUE
      AND collected_at_poly IS NULL
      AND live_bet_placed = TRUE
      AND live_bet_settled = TRUE;

CREATE INDEX IF NOT EXISTS idx_sbp_source_run_placed
    ON strategy_bet_performance (collected_at_event)
    WHERE live_bet_placed = TRUE;
