;/*
    Terrain generator thing
    www.mrspeaker.net/2010/12/12/terrainer-terrain-generator/
    v1.1 of 1.0

    var _ = "mrspeaker",
        email = _ + "@gmail.com",
        twitter = "@" + _,
        web = _ + ".net";

    1. create a seed
    2. for a while...
        3. exand and copy map so each cell becomes 4 (filling map)
        4. refine map - choose cells based on surrounding cells
*/
(function(){

var gen,
    $ = function( selector ){
        return document.getElementById( selector );
    };

// Terrain generator.
gen = {
    type: { "water": 0, "land": 1, "coast": 2 },
    options: {},
    presets: [
        [ 5, 10, 0.2, 4, 200 ],
        [ 6, 3, 0.2, 4, 200 ],
        [ 5, 8, 0.25, 1, 50 ]
    ],
    blur: false,
    running: true,
    context: null,

    init: function() {
        var self = this;
        $( "btn-go" ).innerText = "stop";
        $( "btn-go" ).addEventListener( "click", function() {
            self.running = ! self.running;
            $( "btn-go" ).innerText = self.running ? "stop" : "go";
        }, false);

        // Set presets
        self.setOptions( self.presets[ 0 ] );
        $( "opt-preset" ).addEventListener( "change", function() {
            self.setOptions( self.presets[ this.selectedIndex ] );
        }, false);

        this.context = document.getElementById( "gen" ).getContext( "2d" );

        // Annnnd go!
        this.run();
    },

    run: function(){
        var self = this,
            iterations,
            map;
            
        /*
        Web worker version.
        
        postMessage( map );
        onMessage( e ) = funciton(){
            drawMap( e.data, function(){
                iterate();
            } )
        }
        */

        this.getOptions();

        // 1. Create seed
        map = this.createSeed( this.options.seedSize );

        // Draw inital conditions
        this.drawMap( this.context, map, 0.5 );

        // 2. For a while...
        iterations = this.options.iterations;
        (function iterator() {
            _.delay( function() {
                if ( !self.running ) {
                    iterator();
                    return;
                }

                // 3 & 4. Expand, copy & refine map
                map = self.refineMap( map );

                // Draw it!
                self.drawMap( self.context, map, iterations === 1 ? 0.9 : 0.5 );

                // Update controls
                $( "cur-iterations" ).innerText = ( self.options.iterations - iterations ) + 1;

                // 2b. End "for a while..."
                if ( --iterations ) {
                    iterator();
                    return;
                }

                // 2b. Or start again...
                _.delay( function(){ self.run(); }, 2000 );

            }, gen.options.speed );
        })();
    },

    refineMap: function( map ) {
        // 3. Expand & copy map
        var expandedMap = this.expandMap( map ),
            copiedMap = this.copyMap( expandedMap );

        // 4. Refine map
        for ( var j = 1; j < expandedMap.length - 1; j++ ) {
            for ( var i = 1; i < expandedMap[ 0 ].length - 1; i++ ) {
                // Find the total amount of bordering land cells
                var landSpaces = 0;
                this.cellNeighbours( expandedMap, i, j, true, function( cell ) {
                    landSpaces += cell !== gen.type[ "water" ] ? 1 : 0;
                });

                // Random based on amount of land
                copiedMap[ j ][ i ] =
                    9 - landSpaces > this.options.killIfWater ?
                        this.type[ "water" ] :
                        Math.random() < landSpaces / 9 ? gen.type[ "land" ] : gen.type[ "water" ];
            }
        }

        // And for fun...
        return this.colourEdges( copiedMap );
    },

    createSeed: function( size ) {
        var map = [];
        for( var i = 0; i < size; i++ ) {
            map[ i ] = [];
            for( var j = 0; j < size; j++ ) {
                map[ i ][ j ] = Math.random() > this.options.seedLandChance ?
                    this.type[ "land" ] :
                    this.type[ "water" ];
            }
        }
        return map;
    },

    colourEdges: function( map ) {
        for ( var j = 0; j < map.length - 1; j++ ) {
            for ( var i = 0; i < map[ 0 ].length - 1; i++ ) {
                if( map[ j ][ i ] ) {
                    var waterSpaces = 0;
                    this.cellNeighbours( map, i, j, false, function( cell ){
                        waterSpaces += !cell ? 1 : 0;
                    });
                    if( waterSpaces ) {
                        map[ j ][ i ] = gen.type[ "coast" ];
                    }
                }
            }
        }
        return map;
    },

    // Apply a function to the neighbours of a cell
    cellNeighbours: function( map, x, y, blnSelf, func ) {
        for( var j = -1; j <= 1; j++ ) {
            for( var i = -1; i <= 1; i++ ) {
                var xOff = x + i,
                    yOff = y + j;
                if( ( xOff == x && yOff == y && !blnSelf ) ||
                    ( yOff < 0 || yOff > map.length ) ||
                    ( xOff < 0 || xOff > map[0].length ) ) {
                    continue;
                }
                func( map[ yOff ][ xOff ] );
            }
        }
    },

    // "Expands" a map - so each cell becomes 4
    expandMap: function( map ) {
        var newMap = [];
        for( var j = 0; j < map.length; j++ ){
            var newRow = [];
            for( var i = 0; i < map[ 0 ].length; i++ ){
                newRow.push( map[ j ][ i ] );
                newRow.push( map[ j ][ i ] );
            }
            newMap.push( newRow );
            newMap.push( newRow );
        }
        return newMap;
    },

    // Creates a copy of a map
    copyMap: function( map ) {
        var tmpMap = [];
        _.each( map, function( item ){
            tmpMap[ tmpMap.length ] = _.clone( item );
        });
        return tmpMap;
    },

    // Draws to canvas
    drawMap: function( context, map, fill ) {
        var width = map[ 0 ].length,
            height = map.length,
            canvasWidth = context.canvas.width,
            canvasHeight = context.canvas.height,
            stepX = canvasWidth / map[ 0 ].length,
            stepY = canvasHeight / map.length,
            type,
            count,
            i,j;

        // "Run length encoding" on each line - pixel by pixel was very slow.
        for( j = 0; j < height; j++ ) {
            type = map[ j ][ 0 ];
            count = 1;
            for( i = 1; i < width; i++) {
                if( map[ j ][ i ] == type){
                    count++;
                    continue;
                }
                this.drawLine( context, type, (i - count) * stepX, j * stepY, count * stepX, stepY, fill );
                type = map[ j ][ i ];
                count = 1;
                continue;
            }
            this.drawLine( context, type, (i - count) * stepX, j * stepY, count * stepX, stepY, fill )
        }
    },
    
    drawLine: function( context, type, x, y, width, height, fill ){
        fill = ! this.blur ? 1 : fill || 1;
        switch( type ) {
            case gen.type[ "water" ]:
                context.fillStyle = "rgba(45, 179, 186," + fill + ")";
                break;
            case gen.type["land"]:
                context.fillStyle = "rgba(58, 138, 58," + fill + ")";
                break;
            case gen.type["coast"]:
                context.fillStyle = "rgba(60, 107, 60," + fill + ")";
                break;
        }
        
        context.fillRect(
            Math.floor( x ),
            Math.floor( y),
            Math.ceil( width ),
            Math.ceil( height )
        );
    },

    getOptions: function() {
        this.setOptions([
            this.options.iterations = this.getOption( "opt-iterations", 1, 20, 5 ),
            this.options.seedSize = this.getOption( "opt-seedSize", 1, 40, 5 ),
            this.options.seedLandChance = this.getOption( "opt-seedLandChance", 0, 1, 0.2, true ),
            this.options.killIfWater = this.getOption( "opt-killIfWater", 0, 9, 4 ),
            this.options.speed = this.getOption( "opt-speed", 3, 200000, 200 )
        ]);
    },

    getOption: function( el, min, max, dfault, isFloat ) {
        var meth = isFloat ? parseFloat : parseInt,
            val = meth( $( el ).value, 10 );
        if( val !== 0 && !val ) return dfault;
        if( val < min ) return min;
        if( val > max ) return max;
        return val;
    },

    setOptions: function( optArray ) {
        $( "opt-iterations" ).value = optArray[ 0 ];
        $( "opt-seedSize" ).value = optArray[ 1 ];
        $( "opt-seedLandChance" ).value = optArray[ 2 ];
        $( "opt-killIfWater" ).value = optArray[ 3 ];
        $( "opt-speed" ).value = optArray[ 4 ];
    }
};

this.gen = gen;

})();