var $ = function(selector){
        return document.getElementById(selector);
    },
    gen = {
    type: {'water':0, 'land':1, 'coast':2},
    options: {},
    presets: [ 
        [ 5, 10, 0.2, 4, 200 ], 
        [ 6, 3, 0.2, 4, 200 ],
        [ 5, 8, 0.25, 1, 50 ]
    ],
    running: true,
    context: null,
    init: function(){
        var self = this;
        $('btn-go').innerText = "stop";
        $('btn-go').addEventListener("click", function(){
            self.running = !self.running;
            $('btn-go').innerText = self.running ? "stop" : "go";
        });
        
        // Set presets
        self.setOptions(self.presets[0]);
        $('opt-preset').addEventListener("change", function(){
            self.setOptions(self.presets[this.selectedIndex]);
        });
        
        this.context = document.getElementById("gen").getContext("2d");
        this.run();
    },
    run: function(){
        this.getOptions();
        
        var self = this,
            iterations = this.options.iterations,
            refiner,
            map;
            
        map = this.createSeed([],this.options.seedSize);
        this.drawMap(map);

        (iterator = function(){
            _.delay(function(){
                if(!self.running){
                    iterator();
                    return;
                }
                map = self.refineMap(map);
                self.drawMap(map);
                $('cur-iterations').innerText = (self.options.iterations - iterations) + 1;
                if( --iterations){
                    iterator();
                }
                else {
                    _.delay(function(){
                        self.run();
                    }, 2000)
                }
            }, gen.options.speed);
        })();
    },
    getSeedType: function() {
        return Math.random() > this.options.seedLandChance ? this.type['land'] : this.type['water'];
    },
    addSeedRow: function( map, size ) {
        if( map.length === size ) return map;
        map.push( this.getSeedType() );
        return this.addRow( map, size );
    },
    createSeed: function( map, size ) {
        if( map.length === size ) return map;
        map.push( this.addSeedRow( [],size ) );
        return this.createSeed(map, size);
    },
    refineMap: function( map ){
        map = this.expandMap( map );
        
        // Copy map
        var tmpMap = [];
        _.each(map, function(item){
            tmpMap[ tmpMap.length ] = _.clone(item);
        });
        
        for (j = 1; j < map.length-1; j++) {
            for (i = 1; i < map[0].length-1; i++) {
                // Find the total amount of bordering land cells
                var landSpaces = 0;
                this.cellNeighbours(map,i,j,true,function(cell){
                    landSpaces += cell !== gen.type['water'] ? 1 : 0;
                })

                // Random based on amount of land
                tmpMap[j][i] = 
                    9 - landSpaces > this.options.killIfWater ? 
                        this.type['water'] :
                        Math.random() < landSpaces / 9 ? gen.type['land'] : gen.type['water'];
            }
        }
        this.colourEdges(tmpMap);
        return tmpMap;
    },
    colourEdges: function(map){
        for (j = 1; j < map.length-1; j++) {
            for (i = 1; i < map[0].length-1; i++) {
                if(map[j][i]){
                    var waterSpaces = 0;
                    this.cellNeighbours(map,i,j,false,function(cell){
                        waterSpaces += !cell ? 1 : 0;
                    });
                    if(waterSpaces){
                        map[j][i] = gen.type['coast'];
                    }
                }
            }
        }
        return map;
    },
    cellNeighbours: function(map,x,y,blnSelf,func){
        for(var j = -1; j <= 1; j++){
            for(var i = -1; i <= 1; i++){
                var xOff = x + i,
                    yOff = y + j;
                if(xOff == x && yOff == y && !blnSelf){
                    continue;
                }
                func(map[yOff][xOff]);
            }
        }
    },
    expandMap: function(map){
        var newMap = [];
        _.each(map,function(item){
            var newRow = [];
            _.each(item, function(rowItem){
                newRow.push(rowItem);
                newRow.push(rowItem);
            });
            newMap.push(newRow);
            newMap.push(newRow);
        });
        return newMap;
    },      
    drawMap: function(map){
        var width = map[0].length,
            height = map.length,
            canvasWidth = this.context.canvas.width,
            canvasHeight = this.context.canvas.height,
            stepX = canvasWidth / map[0].length,
            stepY = canvasHeight / map.length,
            size = stepX;
        this.context.clearRect(0,0,canvasWidth,canvasHeight)
        for(var j = 0; j < height; j++){
            for(var i = 0; i < width; i++){
                switch(map[j][i]){
                    case gen.type['water']:
                        this.context.fillStyle = "#2DB3BA";
                        break;
                    case gen.type['land']:
                        this.context.fillStyle = "#3A8A3A";
                        break;
                    case gen.type['coast']:
                        this.context.fillStyle = "#1A5A3A";
                        break;
                }
                this.context.fillRect(
                    Math.floor(i * stepX), 
                    Math.floor(j * stepY),
                    Math.ceil(stepX),
                    Math.ceil(stepY)
                )
            }
        }
    },
    getOptions: function(){
        this.options.iterations = parseInt($('opt-iterations').value);
        this.options.seedSize = parseInt($('opt-seedSize').value);
        this.options.seedLandChance = parseFloat($('opt-seedLandChance').value);
        this.options.killIfWater = parseInt($('opt-killIfWater').value);
        this.options.speed = parseInt($('opt-speed').value);
    },
    setOptions: function(optArray){
        $('opt-iterations').value = optArray[0];
        $('opt-seedSize').value = optArray[1];
        $('opt-seedLandChance').value = optArray[2];
        $('opt-killIfWater').value = optArray[3];
        $('opt-speed').value = optArray[4];
    }
}