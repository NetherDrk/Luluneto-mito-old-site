function roundNumber(num) {
    var suffixes = ["K", "M", "B", "T", "Qa", "Qt", "Sx", "Sp", "Oc", "Nn", "Dc", "UDc", "DDc", "TDc", "QaDc", "QtDc", "SxDc", "SpDc", "ODc", "NDc", "Vi",
        "UVi", "DVi", "TVi", "QaVi", "QtVi", "SxVi", "SpVi", "OcVi", "NnVi", "Tg", "UTg", "DTg", "TTg", "QaTg", "QtTg", "SxTg", "SpTg", "OcTg", "NnTg", "Qd",
        "UQd", "DQd", "TQd", "QaQd", "QtQd", "SxQd", "SpQd", "OcQd", "NnQd", "Qq", "UQq", "DQq", "TQq", "QaQq", "QtQq", "SxQq", "SpQq", "OcQq", "NnQq", "Sg"];
    for(var i = suffixes.length - 1; i >= 0; i--) {
        if (num >= Math.pow(10, 3 * i + 3) * 0.99999) {
            return (Math.floor(num / Math.pow(10, 3 * i + 1)) / 100) + suffixes[i]
        }
    }
    return Math.floor(num);
}

// Classe para refresh rápido
var UIValue = function (id, value) {
    this.id = id;
    this.value = value;
};

var Button = function(id) {
    this.id = id;
};

Button.prototype.refresh = function(activated) {
    $("#" + this.id).prop("disabled", !activated)
};

UIValue.prototype.refresh = function() {
    $("#" + this.id).html(roundNumber(this.value));
};
// Classe para unidades
var calculateGPS;

var Unit = function(baseCost, costGrowth, baseGPS, id) {
    this.baseCost = baseCost;
    this.costGrowth = costGrowth;
    this.amount = new UIValue("units"+id+"-amount", 0);
    this.cost = new UIValue("units"+id+"-cost", baseCost);
    this.cost10 = new UIValue("units"+id+"-cost10", this.calculateCost(10));
    this.cost100 = new UIValue("units"+id+"-cost100", this.calculateCost(100));
    this.unitGPS = new UIValue("units"+id+"-gps", baseGPS);
    this.totalGPS = new UIValue("units"+id+"-totalgps", 0);
    this.buy1 = new Button("units"+id+"-buy1");
    this.buy10 = new Button("units"+id+"-buy10");
    this.buy100 = new Button("units"+id+"-buy100");
    this.buymax = new Button("units"+id+"-buymax");
};

Unit.prototype.calculateCost = function(amount) {
    var calculating = 0;
    var costPerUnit = this.cost.value;
    for(var i = 0; i < amount; i++) {
        calculating += costPerUnit;
        costPerUnit*= this.costGrowth;
    }
    return calculating;
};

Unit.prototype.buy = function(amount) {
    this.cost.value = Math.floor(this.baseCost *  Math.pow(this.costGrowth, this.amount.value));
    if (amount >= 0) {
        var totalCost = this.calculateCost(amount);
        if (player.gold.value < totalCost) return;
        this.amount.value += amount;
        player.gold.value -= totalCost;
        this.cost.value = Math.floor(this.baseCost *  Math.pow(this.costGrowth, this.amount.value));
    } else {
        while(player.gold.value >= this.cost.value) {
            player.gold.value -= this.cost.value;
            this.amount.value++;
            this.cost.value = Math.floor(this.baseCost *  Math.pow(this.costGrowth, this.amount.value));
        }
    }
    this.cost10.value = this.calculateCost(10);
    this.cost100.value = this.calculateCost(100);
    calculateGPS();
};

Unit.prototype.refresh = function() {
    this.amount.refresh();
    this.cost.refresh();
    this.cost10.refresh();
    this.cost100.refresh();
    this.unitGPS.refresh();
    this.totalGPS.refresh();
    this.buy1.refresh(player.gold.value >= this.cost.value);
    this.buy10.refresh(player.gold.value >= this.cost10.value);
    this.buy100.refresh(player.gold.value >= this.cost100.value);
    this.buymax.refresh(player.gold.value >= this.cost.value);
};

Unit.prototype.calculateGPS = function() {
    this.totalGPS.value = this.unitGPS.value * this.amount.value;
};

Unit.prototype.load = function(saveData) {
    this.amount.value = saveData.amount.value;
    this.cost.value = Math.floor(this.baseCost *  Math.pow(this.costGrowth, this.amount.value));
    this.cost10.value = this.calculateCost(10);
    this.cost100.value = this.calculateCost(100);
};
// Variaveis
var player = {};
player.lastTime = Date.now();
player.timeNow = Date.now();
player.gold = new UIValue("gold", 0);
player.gps = new UIValue("gps", 0);
player.gpc = new UIValue("gpc", 1);
player.units = [new Unit(10, 1.1, 1, 0)];

// Funções
function buttonClicked() {
    player.gold.value+=player.gpc.value;
}

function refreshScreen() {
    player.gold.refresh();
    player.gps.refresh();
    player.gpc.refresh();
    for(var x = 0; x < player.units.length; x++) {
        player.units[x].refresh();
    }
}

calculateGPS = function() {
    var calculating = 0;
    for(var x = 0; x < player.units.length; x++) {
        player.units[x].calculateGPS();
        calculating += player.units[x].totalGPS.value;
    }
    player.gps.value = calculating;
};

function gameLoop(interval) {
    var gainedThisLoop = player.gps.value/1000*interval;
    player.gold.value+= gainedThisLoop;
    refreshScreen();
    if (interval > 3 * 1000) window.alert("While offline you earned: " + roundNumber(gainedThisLoop));
}


function loadGameAuto() {
    if (!localStorage['nethergame_save']) return;
    var saveData = JSON.parse(atob(localStorage['nethergame_save']));
    loadGame(saveData);
}

function loadGame(saveData) {
    if (saveData.gold) player.gold.value = saveData.gold.value;
    if (saveData.units) for (var x = 0; x < saveData.units.length; x++) {
        player.units[x].load(saveData.units[x]);
    }
    calculateGPS();
    player.timeNow = Date.now();
    var interval = player.timeNow - saveData.lastTime;
    gameLoop(interval);
    player.lastTime = player.timeNow;
}

loadGameAuto();

function hardReset() {
    if(window.confirm("Are you sure?")) {
        localStorage.removeItem('nethergame_save');
        location.reload();
    }
}

setInterval(function () {
    player.timeNow = Date.now();
    var interval = player.timeNow - player.lastTime;
    player.lastTime = Date.now();
    gameLoop(interval);
}, 1);

setInterval(function () {
    localStorage['nethergame_save'] = btoa(JSON.stringify(player));
}, 2000);