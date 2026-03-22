import { makeObservable, observable, action, computed } from 'mobx';
import { api_base } from '@/external/bot-skeleton';

// Quick Strategy Types
export interface QuickStrategyFormData {
    symbol: string;
    tradetype: string;
    durationtype: string;
    duration: number;
    stake: number;
    size: number;
    profit: number;
    loss: number;
    prediction?: number; // For Over/Under strategies
    action: 'RUN' | 'EDIT';
}

export interface QuickStrategyConfig {
    label: string;
    description: string;
    fields: string[];
    disabled_markets?: string[];
    disabled_trade_types?: string[];
}

// Pre-built strategies from Korean site
export const QUICK_STRATEGIES = {
    MARTINGALE: {
        label: 'Martingale',
        description: 'Increases stake after each loss to recover previous losses',
        fields: ['symbol', 'tradetype', 'durationtype', 'duration', 'stake', 'size', 'profit', 'loss'],
        disabled_markets: [],
        disabled_trade_types: []
    },
    D_ALEMBERT: {
        label: "D'Alembert",
        description: 'Increases stake by a fixed amount after each loss',
        fields: ['symbol', 'tradetype', 'durationtype', 'duration', 'stake', 'size', 'profit', 'loss'],
        disabled_markets: [],
        disabled_trade_types: []
    },
    OSCARS_GRIND: {
        label: "Oscar's Grind",
        description: 'Increases stake after each loss until a profit is made',
        fields: ['symbol', 'tradetype', 'durationtype', 'duration', 'stake', 'size', 'profit', 'loss'],
        disabled_markets: [],
        disabled_trade_types: []
    },
    OVER_UNDER: {
        label: 'Over/Under',
        description: 'Predicts if the last digit will be over or under a specific number',
        fields: ['symbol', 'tradetype', 'durationtype', 'duration', 'stake', 'size', 'profit', 'loss', 'prediction'],
        disabled_markets: [],
        disabled_trade_types: [],
        trade_type: 'overunder',
        contract_types: ['DIGITOVER', 'DIGITUNDER']
    },
    EVEN_ODD: {
        label: 'Even/Odd',
        description: 'Predicts if the last digit will be even or odd',
        fields: ['symbol', 'tradetype', 'durationtype', 'duration', 'stake', 'size', 'profit', 'loss'],
        disabled_markets: [],
        disabled_trade_types: [],
        trade_type: 'evenodd',
        contract_types: ['DIGITEVEN', 'DIGITODD']
    }
};

// Default configuration from Korean site
export const QUICK_STRATEGY_DEFAULTS = {
    symbol: '1HZ100V',  // Korean site default: Volatility 100 (1s) Index
    tradetype: 'callput',
    durationtype: 't',
    duration: 1,
    stake: 1,
    size: 1,  // Korean site default: 1x multiplier
    profit: 10,
    loss: 10,
    prediction: 5, // Default prediction digit for Over/Under
    action: 'RUN' as const
};

class QuickStrategyService {
    selected_strategy: keyof typeof QUICK_STRATEGIES = 'MARTINGALE';
    form_data: QuickStrategyFormData = { ...QUICK_STRATEGY_DEFAULTS };
    is_stop_bot_dialog_open = false;
    is_strategy_modal_open = false;

    constructor() {
        makeObservable(this, {
            selected_strategy: observable,
            form_data: observable,
            is_stop_bot_dialog_open: observable,
            is_strategy_modal_open: observable,
            setSelectedStrategy: action,
            setFormData: action,
            setValue: action,
            toggleStopBotDialog: action,
            toggleStrategyModal: action,
            resetFormData: action,
            current_strategy_config: computed,
            is_valid_form: computed
        });
    }

    setSelectedStrategy = (strategy: keyof typeof QUICK_STRATEGIES) => {
        this.selected_strategy = strategy;
        this.resetFormData();
    };

    setFormData = (data: Partial<QuickStrategyFormData>) => {
        this.form_data = { ...this.form_data, ...data };
    };

    setValue = (field: keyof QuickStrategyFormData, value: any) => {
        this.form_data[field] = value;
    };

    toggleStopBotDialog = () => {
        this.is_stop_bot_dialog_open = !this.is_stop_bot_dialog_open;
    };

    toggleStrategyModal = () => {
        this.is_strategy_modal_open = !this.is_strategy_modal_open;
    };

    resetFormData = () => {
        this.form_data = { ...QUICK_STRATEGY_DEFAULTS };
    };

    get current_strategy_config(): QuickStrategyConfig {
        return QUICK_STRATEGIES[this.selected_strategy];
    }

    get is_valid_form(): boolean {
        const { stake, size, profit, loss, duration, prediction } = this.form_data;
        const basicValidation = stake > 0 && size > 0 && profit > 0 && loss > 0 && duration > 0;
        
        // Additional validation for Over/Under strategies
        if (this.selected_strategy === 'OVER_UNDER') {
            return basicValidation && prediction !== undefined && prediction >= 0 && prediction <= 9;
        }
        
        return basicValidation;
    }

    // Generate strategy XML based on selected strategy and form data
    generateStrategyXML = (): string => {
        const { selected_strategy, form_data } = this;
        const { symbol, tradetype, durationtype, duration, stake, size, profit, loss, prediction } = form_data;

        // Determine trade type and contract type based on strategy
        let actualTradeType = tradetype;
        let contractType = 'CALL';
        
        if (selected_strategy === 'OVER_UNDER') {
            actualTradeType = 'overunder';
            contractType = 'DIGITOVER'; // Default to OVER, can be changed in strategy logic
        } else if (selected_strategy === 'EVEN_ODD') {
            actualTradeType = 'evenodd';
            contractType = 'DIGITEVEN'; // Default to EVEN, can be changed in strategy logic
        }

        // Base XML template for quick strategies
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="stake">stake</variable>
    <variable id="profit">profit</variable>
    <variable id="loss">loss</variable>
    <variable id="size">size</variable>`;

        // Add prediction variable for Over/Under strategies
        if (selected_strategy === 'OVER_UNDER') {
            xml += `
    <variable id="prediction">prediction</variable>`;
        }

        xml += `
  </variables>
  <block type="trade_definition_tradeoptions" id="trade_definition" x="0" y="0">
    <field name="MARKET_LIST">${symbol}</field>
    <field name="SUBMARKET_LIST">random_index</field>
    <field name="SYMBOL_LIST">${symbol}</field>
    <field name="TRADETYPECAT_LIST">${selected_strategy === 'OVER_UNDER' || selected_strategy === 'EVEN_ODD' ? 'digits' : 'callput'}</field>
    <field name="TRADETYPE_LIST">${actualTradeType}</field>
    <field name="TYPE_LIST">${contractType}</field>
    <field name="CANDLEINTERVAL_LIST">60</field>
    <field name="DURATIONTYPE_LIST">${durationtype}</field>
    <value name="DURATION">
      <block type="math_number" id="duration_value">
        <field name="NUM">${duration}</field>
      </block>
    </value>
    <value name="AMOUNT">
      <block type="variables_get" id="stake_var">
        <field name="VAR">stake</field>
      </block>
    </value>`;

        // Add prediction value for Over/Under strategies
        if (selected_strategy === 'OVER_UNDER') {
            xml += `
    <value name="PREDICTION">
      <block type="variables_get" id="prediction_var">
        <field name="VAR">prediction</field>
      </block>
    </value>`;
        }

        xml += `
    <next>
      <block type="trade_definition_restartonerror" id="restart_on_error">
        <field name="RESTARTONERROR">TRUE</field>
        <next>`;

        // Add strategy-specific logic
        switch (selected_strategy) {
            case 'MARTINGALE':
                xml += this.generateMartingaleLogic();
                break;
            case 'D_ALEMBERT':
                xml += this.generateDAlembergLogic();
                break;
            case 'OSCARS_GRIND':
                xml += this.generateOscarsGrindLogic();
                break;
            case 'OVER_UNDER':
                xml += this.generateOverUnderLogic();
                break;
            case 'EVEN_ODD':
                xml += this.generateEvenOddLogic();
                break;
        }

        xml += `
        </next>
      </block>
    </next>
  </block>
  <block type="variables_set" id="init_stake" x="0" y="300">
    <field name="VAR">stake</field>
    <value name="VALUE">
      <block type="math_number" id="initial_stake">
        <field name="NUM">${stake}</field>
      </block>
    </value>
  </block>
  <block type="variables_set" id="init_profit" x="0" y="350">
    <field name="VAR">profit</field>
    <value name="VALUE">
      <block type="math_number" id="initial_profit">
        <field name="NUM">${profit}</field>
      </block>
    </value>
  </block>
  <block type="variables_set" id="init_loss" x="0" y="400">
    <field name="VAR">loss</field>
    <value name="VALUE">
      <block type="math_number" id="initial_loss">
        <field name="NUM">${loss}</field>
      </block>
    </value>
  </block>
  <block type="variables_set" id="init_size" x="0" y="450">
    <field name="VAR">size</field>
    <value name="VALUE">
      <block type="math_number" id="initial_size">
        <field name="NUM">${size}</field>
      </block>
    </value>
  </block>`;

        // Add prediction initialization for Over/Under strategies
        if (selected_strategy === 'OVER_UNDER') {
            xml += `
  <block type="variables_set" id="init_prediction" x="0" y="500">
    <field name="VAR">prediction</field>
    <value name="VALUE">
      <block type="math_number" id="initial_prediction">
        <field name="NUM">${prediction || 5}</field>
      </block>
    </value>
  </block>`;
        }

        xml += `
</xml>`;

        return xml;
    };

    private generateMartingaleLogic = (): string => {
        return `
          <block type="after_purchase" id="after_purchase">
            <statement name="AFTERPURCHASE_STACK">
              <block type="controls_if" id="martingale_logic">
                <value name="IF0">
                  <block type="contract_check_result" id="check_win">
                    <field name="CHECK_RESULT">win</field>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set" id="reset_stake_win">
                    <field name="VAR">stake</field>
                    <value name="VALUE">
                      <block type="math_number" id="base_stake">
                        <field name="NUM">${this.form_data.stake}</field>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="controls_if" id="loss_logic">
                    <value name="IF0">
                      <block type="contract_check_result" id="check_loss">
                        <field name="CHECK_RESULT">loss</field>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set" id="increase_stake">
                        <field name="VAR">stake</field>
                        <value name="VALUE">
                          <block type="math_arithmetic" id="multiply_stake">
                            <field name="OP">MULTIPLY</field>
                            <value name="A">
                              <block type="variables_get" id="current_stake">
                                <field name="VAR">stake</field>
                              </block>
                            </value>
                            <value name="B">
                              <block type="variables_get" id="multiplier">
                                <field name="VAR">size</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>`;
    };

    private generateDAlembergLogic = (): string => {
        return `
          <block type="after_purchase" id="after_purchase">
            <statement name="AFTERPURCHASE_STACK">
              <block type="controls_if" id="dalembert_logic">
                <value name="IF0">
                  <block type="contract_check_result" id="check_win">
                    <field name="CHECK_RESULT">win</field>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set" id="decrease_stake">
                    <field name="VAR">stake</field>
                    <value name="VALUE">
                      <block type="math_arithmetic" id="subtract_stake">
                        <field name="OP">MINUS</field>
                        <value name="A">
                          <block type="variables_get" id="current_stake">
                            <field name="VAR">stake</field>
                          </block>
                        </value>
                        <value name="B">
                          <block type="variables_get" id="unit_size">
                            <field name="VAR">size</field>
                          </block>
                        </value>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="controls_if" id="loss_logic">
                    <value name="IF0">
                      <block type="contract_check_result" id="check_loss">
                        <field name="CHECK_RESULT">loss</field>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set" id="increase_stake">
                        <field name="VAR">stake</field>
                        <value name="VALUE">
                          <block type="math_arithmetic" id="add_stake">
                            <field name="OP">ADD</field>
                            <value name="A">
                              <block type="variables_get" id="current_stake">
                                <field name="VAR">stake</field>
                              </block>
                            </value>
                            <value name="B">
                              <block type="variables_get" id="unit_size">
                                <field name="VAR">size</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>`;
    };

    private generateOscarsGrindLogic = (): string => {
        return `
          <block type="after_purchase" id="after_purchase">
            <statement name="AFTERPURCHASE_STACK">
              <block type="controls_if" id="oscars_logic">
                <value name="IF0">
                  <block type="contract_check_result" id="check_win">
                    <field name="CHECK_RESULT">win</field>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set" id="reset_stake_win">
                    <field name="VAR">stake</field>
                    <value name="VALUE">
                      <block type="math_number" id="base_stake">
                        <field name="NUM">${this.form_data.stake}</field>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="controls_if" id="loss_logic">
                    <value name="IF0">
                      <block type="contract_check_result" id="check_loss">
                        <field name="CHECK_RESULT">loss</field>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set" id="increase_stake">
                        <field name="VAR">stake</field>
                        <value name="VALUE">
                          <block type="math_arithmetic" id="add_unit">
                            <field name="OP">ADD</field>
                            <value name="A">
                              <block type="variables_get" id="current_stake">
                                <field name="VAR">stake</field>
                              </block>
                            </value>
                            <value name="B">
                              <block type="variables_get" id="unit_size">
                                <field name="VAR">size</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>`;
    };

    private generateOverUnderLogic = (): string => {
        return `
          <block type="after_purchase" id="after_purchase">
            <statement name="AFTERPURCHASE_STACK">
              <block type="controls_if" id="over_under_logic">
                <value name="IF0">
                  <block type="contract_check_result" id="check_win">
                    <field name="CHECK_RESULT">win</field>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set" id="reset_stake_win">
                    <field name="VAR">stake</field>
                    <value name="VALUE">
                      <block type="math_number" id="base_stake">
                        <field name="NUM">${this.form_data.stake}</field>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="controls_if" id="loss_logic">
                    <value name="IF0">
                      <block type="contract_check_result" id="check_loss">
                        <field name="CHECK_RESULT">loss</field>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set" id="increase_stake">
                        <field name="VAR">stake</field>
                        <value name="VALUE">
                          <block type="math_arithmetic" id="multiply_stake">
                            <field name="OP">MULTIPLY</field>
                            <value name="A">
                              <block type="variables_get" id="current_stake">
                                <field name="VAR">stake</field>
                              </block>
                            </value>
                            <value name="B">
                              <block type="variables_get" id="multiplier">
                                <field name="VAR">size</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>`;
    };

    private generateEvenOddLogic = (): string => {
        return `
          <block type="after_purchase" id="after_purchase">
            <statement name="AFTERPURCHASE_STACK">
              <block type="controls_if" id="even_odd_logic">
                <value name="IF0">
                  <block type="contract_check_result" id="check_win">
                    <field name="CHECK_RESULT">win</field>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set" id="reset_stake_win">
                    <field name="VAR">stake</field>
                    <value name="VALUE">
                      <block type="math_number" id="base_stake">
                        <field name="NUM">${this.form_data.stake}</field>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="controls_if" id="loss_logic">
                    <value name="IF0">
                      <block type="contract_check_result" id="check_loss">
                        <field name="CHECK_RESULT">loss</field>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set" id="increase_stake">
                        <field name="VAR">stake</field>
                        <value name="VALUE">
                          <block type="math_arithmetic" id="multiply_stake">
                            <field name="OP">MULTIPLY</field>
                            <value name="A">
                              <block type="variables_get" id="current_stake">
                                <field name="VAR">stake</field>
                              </block>
                            </value>
                            <value name="B">
                              <block type="variables_get" id="multiplier">
                                <field name="VAR">size</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>`;
    };

    // Execute strategy - load into bot builder and optionally run
    executeStrategy = async (autoRun = false) => {
        try {
            const xml = this.generateStrategyXML();
            
            // Create strategy object for loading
            const strategy = {
                id: `quick_strategy_${this.selected_strategy}_${Date.now()}`,
                name: `${QUICK_STRATEGIES[this.selected_strategy].label} Strategy`,
                xml: xml,
                save_type: 'LOCAL'
            };

            // Load strategy into bot builder
            const { load_modal } = await import('@/external/bot-skeleton');
            if (load_modal && typeof load_modal.loadStrategyToBuilder === 'function') {
                await load_modal.loadStrategyToBuilder(strategy);
                
                // Switch to bot builder tab
                const switchEvent = new CustomEvent('switch.tab', {
                    detail: { tab: 1 } // BOT_BUILDER tab index
                });
                window.dispatchEvent(switchEvent);

                // Auto-run if requested
                if (autoRun) {
                    setTimeout(() => {
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                        }
                    }, 1000);
                }

                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to execute quick strategy:', error);
            return false;
        }
    };
}

// Export singleton instance
export const quickStrategyService = new QuickStrategyService();