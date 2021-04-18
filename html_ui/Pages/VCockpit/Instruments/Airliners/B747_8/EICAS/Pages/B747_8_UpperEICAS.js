var B747_8_UpperEICAS;
(function (B747_8_UpperEICAS) {
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;

            this.tmaDisplay = null;
            this.allValueComponents = new Array();
            this.allEngineInfos = new Array();
            this.gearDisplay = null;
            this.flapsDisplay = null;
            this.stabDisplay = null;
            this.allAntiIceStatus = new Array();
            this.gallonToMegagrams = 0;
            this.gallonToMegapounds = 0;
        }
        get templateID() { return "B747_8UpperEICASTemplate"; }
        connectedCallback() {
            super.connectedCallback();
        }
        init(_eicas) {
            this.eicas = _eicas;
            this.unitTextSVG = this.querySelector("#TOTAL_FUEL_Units");
            this.refThrust1 = this.querySelector("#THROTTLE1_Value");
            this.refThrust2 = this.querySelector("#THROTTLE2_Value");
            this.refThrust3 = this.querySelector("#THROTTLE3_Value");
            this.refThrust4 = this.querySelector("#THROTTLE4_Value");
            this.tmaDisplay = new Boeing.ThrustModeDisplay(this.querySelector("#TMA_Value"));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#TAT_Value"), Simplane.getTotalAirTemperature, 0, Airliners.DynamicValueComponent.formatValueToPosNegTemperature));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#SAT_Value"), Simplane.getAmbientTemperature, 0, Airliners.DynamicValueComponent.formatValueToPosNegTemperature));
            this.cabinAlt = this.querySelector("#CAB_ALT_Value");
            this.cabinRate = this.querySelector("#RATE_Value");
            this.deltaP = this.querySelector("#DELTAP_Value");
            this.grossWeight = this.querySelector("#GROSS_WEIGHT_Value");
            this.totalFuel = this.querySelector("#TOTAL_FUEL_Value");
            var n1Parent = this.querySelector("#N1Gauges");
            var egtParent = this.querySelector("#EGTGauges");
            for (var engine = 1; engine <= Simplane.getEngineCount(); ++engine) {
                this.allEngineInfos.push(new EngineInfo(engine, this.eicas, n1Parent, egtParent));
                this.allAntiIceStatus.push(new EngineAntiIceStatus(this.querySelector("#EAI" + engine + "_Value"), engine));
            }
            this.infoPanel = new Boeing.InfoPanel(this, "InfoPanel");
            this.infoPanel.init();
            this.infoPanelsManager = new Boeing.InfoPanelsManager();
            this.infoPanelsManager.init(this.infoPanel);
            this.gearDisplay = new Boeing.GearDisplay(this.querySelector("#GearInfo"));
            this.flapsDisplay = new Boeing.FlapsDisplay(this.querySelector("#FlapsInfo"), this.querySelector("#FlapsLine"), this.querySelector("#FlapsValue"), this.querySelector("#FlapsBar"), this.querySelector("#FlapsGauge"));
            this.stabDisplay = new Boeing.StabDisplay(this.querySelector("#StabInfo"), 15, 1);
            this.allAntiIceStatus.push(new WingAntiIceStatus(this.querySelector("#WAI1_Value"), 1));
            this.allAntiIceStatus.push(new WingAntiIceStatus(this.querySelector("#WAI2_Value"), 2));
            this.gallonToMegagrams = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram") * 0.001;
            this.gallonToMegapounds = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "lbs") * 0.001;
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            this.updateReferenceThrust();
            this.updatePressurisationValues();
            this.updateWeights();
            if (this.tmaDisplay) {
                this.tmaDisplay.update();
            }
            if (this.allValueComponents != null) {
                for (var i = 0; i < this.allValueComponents.length; ++i) {
                    this.allValueComponents[i].refresh();
                }
            }
            if (this.allEngineInfos != null) {
                for (var i = 0; i < this.allEngineInfos.length; ++i) {
                    this.allEngineInfos[i].refresh();
                }
            }
            if (this.gearDisplay != null) {
                this.gearDisplay.update(_deltaTime);
            }
            if (this.flapsDisplay != null) {
                this.flapsDisplay.update(_deltaTime);
            }
            if (this.stabDisplay != null) {
                this.stabDisplay.update(_deltaTime);
            }
            if (this.allAntiIceStatus != null) {
                for (var i = 0; i < this.allAntiIceStatus.length; ++i) {
                    if (this.allAntiIceStatus[i] != null) {
                        this.allAntiIceStatus[i].refresh();
                    }
                }
            }
            if (this.infoPanel) {
                this.infoPanel.update(_deltaTime);
            }
            if (this.unitTextSVG) {
                if (BaseAirliners.unitIsMetric(Aircraft.B747_8))
                    this.unitTextSVG.textContent = "KGS X";
                else
                    this.unitTextSVG.textContent = "LBS X";
            }
        }
        updateReferenceThrust() {
            this.refThrust1.textContent = (Simplane.getEngineThrottleMaxThrust(0) * 10).toFixed(0);
            this.refThrust2.textContent = (Simplane.getEngineThrottleMaxThrust(1) * 10).toFixed(0);
            this.refThrust3.textContent = (Simplane.getEngineThrottleMaxThrust(2) * 10).toFixed(0);
            this.refThrust4.textContent = (Simplane.getEngineThrottleMaxThrust(3) * 10).toFixed(0);
            return;
        }
        updatePressurisationValues() {
            this.cabinAlt.textContent = (Math.round(Simplane.getPressurisationCabinAltitude() / 100) * 100).toFixed(0);
            this.cabinRate.textContent = (Math.round(Simplane.getPressurisationCabinAltitudeRate() / 100) * 100).toFixed(0);
            let deltaPValue = Math.abs(Simplane.getPressurisationDifferential() * 10);
            if (Math.round(deltaPValue) < 10) {
                this.deltaP.textContent = "0" + deltaPValue.toFixed(0);
            }
            else {
                this.deltaP.textContent = deltaPValue.toFixed(0);
            }
            return;
        }
        updateWeights() {
            this.grossWeight.textContent = (this.getGrossWeightInMegagrams() * 10).toFixed(0);
            this.totalFuel.textContent = (this.getTotalFuelInMegagrams() * 10).toFixed(0);
            return;
        }
        getGrossWeightInMegagrams() {
            if (BaseAirliners.unitIsMetric(Aircraft.B747_8)) {
                return SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") * 0.001;
            }
            return SimVar.GetSimVarValue("TOTAL WEIGHT", "lbs") * 0.001;
        }
        getTotalFuelInMegagrams() {
            let factor = this.gallonToMegapounds;
            if (BaseAirliners.unitIsMetric(Aircraft.B747_8))
                factor = this.gallonToMegagrams;
            return (SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * factor);
        }
        getInfoPanelManager() {
            return this.infoPanelsManager;
        }
    }
    B747_8_UpperEICAS.Display = Display;
    class EngineInfo {
        constructor(_engine, _eicas, _n1Parent, _egtParent) {
            this.isVNavActive = false;
            this.engine = _engine;
            this.eicas = _eicas;
            this.n1Gauge = window.document.createElement("b747-8-eicas-gauge");
            this.n1Gauge.init(this.createN1GaugeDefinition(_engine));
            this.egtGauge = window.document.createElement("b747-8-eicas-gauge");
            this.egtGauge.init(this.createEGTGaugeDefinition(_engine));
            if (_n1Parent != null) {
                _n1Parent.appendChild(this.n1Gauge);
            }
            if (_egtParent != null) {
                _egtParent.appendChild(this.egtGauge);
            }
        }
        createN1GaugeDefinition(_engine) {
            var definition = new B747_8_EICAS_Common.GaugeDefinition();
            definition.getValue = this.getN1Value.bind(this);
            definition.maxValue = 1100;
            definition.valueBoxWidth = 70;
            definition.valueTextPrecision = 0;
            definition.barHeight = 80;
            definition.type = 0;
            definition.addLineDefinition(1100, 32, "gaugeMarkerDanger");
            definition.addLineDefinition(1000, 22, "gaugeMarkerWarning");
            definition.addLineDefinition(0, 22, "gaugeMarkerCurrent", this.getN1CommandedValue.bind(this));
            definition.addLineDefinition(0, 40, "gaugeMarkerNormal", this.getN1LimitValue.bind(this));
            return definition;
        }
        getN1Value() {
            return SimVar.GetSimVarValue("ENG N1 RPM:" + this.engine, "percent") * 10;
        }
        getN1CommandedValue() {
            return Math.abs(Simplane.getEngineThrottleCommandedN1(this.engine - 1)) * 10;
        }
        getN1LimitValue() {
            return Math.abs(Simplane.getEngineThrottleMaxThrust(this.engine - 1)) * 10;
        }
        createEGTGaugeDefinition(_engine) {
            var definition = new B747_8_EICAS_Common.GaugeDefinition();
            definition.getValue = this.getEGTValue.bind(this);
            definition.maxValue = 1000;
            definition.valueBoxWidth = 70;
            definition.barHeight = 40;
            definition.type = 1;
            definition.addLineDefinition(1000, 32, "gaugeMarkerDanger");
            definition.addLineDefinition(950, 22, "gaugeMarkerWarning");
            definition.addLineDefinition(0, 32, "gaugeMarkerDanger", this.getEGTLimitValue.bind(this));
            definition.addLineDefinition(0, 22, "gaugeMarkerCurrent", this.getEGTValue.bind(this));
            return definition;
        }
        getEGTValue() {
            return SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:" + this.engine, "celsius");
        }
        getEGTLimitValue() {
            return 750;
        }
        refresh() {
            if (this.n1Gauge != null) {
                let VNavActive = SimVar.GetSimVarValue("L:AP_VNAV_ACTIVE", "number");
                if (VNavActive != this.isVNavActive) {
                    this.isVNavActive = VNavActive;
                    let n1Limit = this.n1Gauge.getDynamicLine(1);
                    if (n1Limit) {
                        if (VNavActive) {
                            n1Limit.line.setAttribute("class", "gaugeMarkerManaged");
                        }
                        else {
                            n1Limit.line.setAttribute("class", "gaugeMarkerNormal");
                        }
                    }
                }
                this.n1Gauge.refresh();
            }
            if (this.egtGauge != null) {
                let egtLimit = this.egtGauge.getDynamicLine(0);
                if (egtLimit) {
                    if (this.eicas.getFuelValveOpen(this.engine) && Math.round(this.eicas.getN2Value(this.engine)) >= this.eicas.getN2IdleValue()) {
                        egtLimit.line.setAttribute("display", "none");
                    }
                    else {
                        egtLimit.line.setAttribute("display", "block");
                    }
                }
                this.egtGauge.refresh(true);
            }
        }
    }
    class AntiIceStatus {
        constructor(_element, _index) {
            this.element = null;
            this.index = -1;
            this.isActive = false;
            this.element = _element;
            this.index = _index;
            this.setState(false);
        }
        refresh() {
            var active = this.getCurrentActiveState();
            if (active != this.isActive) {
                this.setState(active);
            }
        }
        setState(_active) {
            if (this.element != null) {
                this.element.style.display = _active ? "block" : "none";
            }
            this.isActive = _active;
        }
    }
    class EngineAntiIceStatus extends AntiIceStatus {
        getCurrentActiveState() {
            return SimVar.GetSimVarValue("ENG ANTI ICE:" + this.index, "bool");
        }
    }
    class WingAntiIceStatus extends AntiIceStatus {
        getCurrentActiveState() {
            return SimVar.GetSimVarValue("STRUCTURAL DEICE SWITCH", "bool");
        }
    }
})(B747_8_UpperEICAS || (B747_8_UpperEICAS = {}));
customElements.define("b747-8-upper-eicas", B747_8_UpperEICAS.Display);
//# sourceMappingURL=B747_8_UpperEICAS.js.map