/**
 * Auto Trading Monitor Service
 *
 * Central bot control service.
 * Conditions are passed in directly — no localStorage reads during monitoring.
 *
 * Stop strategy (in order):
 *   1. window.run_panel.onStopButtonClick()  — clean MobX store stop
 *   2. window.dbot.stopBot()                 — direct DBot engine stop
 *   3. window.dbot.terminateBot()            — hard terminate fallback
 */

import { marketAnalyzer, AnalysisResult } from './market-analyzer.service';

type BotState = 'running' | 'stopped';

export interface MonitorCondition {
    type: 'over-under' | 'even-odd';
    targetValue: string; // 'Over' | 'Under' | 'Even' | 'Odd'
    comparison: string; // '>' | '>=' | '<' | '<=' | '='
    threshold: number;
    lastNTicks?: number; // even-odd only
}

class AutoTradingMonitorService {
    private isMonitoring = false;
    private condition: MonitorCondition | null = null;
    private listeners: Map<string, Set<Function>> = new Map();
    private readonly CHECK_INTERVAL_MS = 500;
    private lastCheckTime = 0;

    // ── Bot control ──────────────────────────────────────────────────────────

    private getRunPanel(): any {
        return (window as any).run_panel ?? null;
    }

    private getDBot(): any {
        return (window as any).dbot ?? null;
    }

    /**
     * Returns true if the bot engine is active.
     * Checks both run_panel.is_running AND run_panel.has_open_contract
     * because the bot can be "stopping" (has_open_contract=true, is_running=false).
     */
    public getBotRunning(): boolean {
        const rp = this.getRunPanel();
        if (rp) {
            const running = !!rp.is_running;
            const hasContract = !!rp.has_open_contract;
            return running || hasContract;
        }
        // Fallback: assume not running if store unavailable
        return false;
    }

    public stopBot(): void {
        const rp = this.getRunPanel();
        const dbot = this.getDBot();

        console.log('[MONITOR] stopBot() called');
        console.log('[MONITOR]   run_panel available:', !!rp);
        console.log('[MONITOR]   dbot available:', !!dbot);
        if (rp) {
            console.log('[MONITOR]   is_running:', rp.is_running, '| has_open_contract:', rp.has_open_contract);
        }

        let stopped = false;

        // Path 1: run_panel.onStopButtonClick — preferred, handles MobX state + multiplier check
        if (rp && (rp.is_running || rp.has_open_contract)) {
            try {
                console.log('[MONITOR] → Calling run_panel.onStopButtonClick()');
                rp.onStopButtonClick();
                stopped = true;
            } catch (e) {
                console.warn('[MONITOR] run_panel.onStopButtonClick() threw:', e);
            }
        }

        // Path 2: dbot.stopBot() — direct engine stop (works even if run_panel state is stale)
        if (dbot) {
            try {
                console.log('[MONITOR] → Calling dbot.stopBot()');
                dbot.stopBot();
                stopped = true;
            } catch (e) {
                console.warn('[MONITOR] dbot.stopBot() threw:', e);
            }
        }

        // Path 3: hard terminate fallback
        if (!stopped && dbot) {
            try {
                console.log('[MONITOR] → Calling dbot.terminateBot() (fallback)');
                dbot.terminateBot();
            } catch (e) {
                console.warn('[MONITOR] dbot.terminateBot() threw:', e);
            }
        }

        // Sync run_panel state in case dbot.stopBot() didn't trigger MobX update
        if (rp && typeof rp.setIsRunning === 'function') {
            try {
                rp.setIsRunning(false);
            } catch {}
        }

        this.emit('bot:stopped');
    }

    public startBot(): void {
        const rp = this.getRunPanel();

        console.log('[MONITOR] startBot() called');
        console.log('[MONITOR]   run_panel available:', !!rp);
        if (rp) {
            console.log('[MONITOR]   is_running:', rp.is_running);
        }

        if (!rp) {
            console.warn('[MONITOR] run_panel not available — cannot start bot');
            return;
        }

        if (rp.is_running) {
            console.log('[MONITOR] Bot already running — skipping start');
            return;
        }

        try {
            console.log('[MONITOR] → Calling run_panel.onRunButtonClick()');
            rp.onRunButtonClick();
            this.emit('bot:started');
        } catch (e) {
            console.error('[MONITOR] run_panel.onRunButtonClick() threw:', e);
        }
    }

    public getBotState(): BotState {
        return this.getBotRunning() ? 'running' : 'stopped';
    }

    // ── Monitoring ───────────────────────────────────────────────────────────

    public startMonitoring(condition: MonitorCondition): void {
        this.condition = condition;

        if (this.isMonitoring) {
            console.log('[MONITOR] Already monitoring — condition updated');
            return;
        }

        console.log('[MONITOR] Starting condition monitoring:', condition);
        this.isMonitoring = true;
        marketAnalyzer.on('analysis', this.handleAnalysis);
    }

    public stopMonitoring(): void {
        if (!this.isMonitoring) return;
        console.log('[MONITOR] Stopping condition monitoring');
        this.isMonitoring = false;
        this.condition = null;
        marketAnalyzer.off('analysis', this.handleAnalysis);
    }

    public updateCondition(condition: MonitorCondition): void {
        console.log('[MONITOR] Condition updated:', condition);
        this.condition = condition;
    }

    private handleAnalysis = (result: AnalysisResult): void => {
        if (!this.condition) return;

        const now = Date.now();
        if (now - this.lastCheckTime < this.CHECK_INTERVAL_MS) return;
        this.lastCheckTime = now;

        if (result.strategyType !== this.condition.type) return;

        const conditionMet = this.evaluateCondition(result, this.condition);
        const botRunning = this.getBotRunning();

        console.log(`[MONITOR] ${this.condition.type} | conditionMet=${conditionMet} | botRunning=${botRunning}`);

        if (!conditionMet && botRunning) {
            console.log('[MONITOR] ⛔ Conditions failed — stopping bot');
            this.stopBot();
            this.emit('condition:failed', { type: this.condition.type });
        } else if (conditionMet && !botRunning) {
            console.log('[MONITOR] ✅ Conditions met — starting bot');
            this.startBot();
            this.emit('condition:met', { type: this.condition.type });
        }
    };

    private evaluateCondition(result: AnalysisResult, condition: MonitorCondition): boolean {
        if (condition.type === 'over-under') {
            const overProb = parseFloat(result.data.overProbability);
            const underProb = parseFloat(result.data.underProbability);
            const prob = condition.targetValue === 'Over' ? overProb : underProb;
            return this.compare(prob, condition.comparison, condition.threshold);
        }

        if (condition.type === 'even-odd') {
            const evenProb = parseFloat(result.data.evenProbability);
            const oddProb = parseFloat(result.data.oddProbability);
            const prob = condition.targetValue === 'Even' ? evenProb : oddProb;
            const probMet = this.compare(prob, condition.comparison, condition.threshold);

            const pattern: string[] = result.data.evenOddPattern || [];
            const n = condition.lastNTicks ?? 3;
            const last = pattern.slice(-n);
            const target = condition.targetValue === 'Even' ? 'E' : 'O';
            const patternMet = last.length === n && last.every(p => p === target);

            return probMet && patternMet;
        }

        return false;
    }

    private compare(value: number, op: string, threshold: number): boolean {
        switch (op) {
            case '>':
                return value > threshold;
            case '>=':
                return value >= threshold;
            case '<':
                return value < threshold;
            case '<=':
                return value <= threshold;
            case '=':
                return Math.abs(value - threshold) < 0.1;
            default:
                return false;
        }
    }

    // ── Event bus ────────────────────────────────────────────────────────────

    public on(event: string, cb: Function): void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(cb);
    }

    public off(event: string, cb: Function): void {
        this.listeners.get(event)?.delete(cb);
    }

    private emit(event: string, data?: any): void {
        this.listeners.get(event)?.forEach(cb => {
            try {
                cb(data);
            } catch {}
        });
    }
}

export const autoTradingMonitor = new AutoTradingMonitorService();
