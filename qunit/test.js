module("General")

test("setup", function() {
	expect(1)
	ok(gen, "object gen exists")
})

test("seed", function(){
    expect(5)
    gen.options = {
        iterations : 4,
        seedSize : 4,
        seedLandChance : 0.2,
        killIfWater : 4
    }
    var seedSize = gen.options.seedSize
    
	var seed = gen.createSeed(seedSize),
        allSameSize = _.all(seed,function(arr){
            return arr.length == seedSize;
        })

	equals( seed.length, seedSize, "seed correct length" );
	ok( allSameSize, "seed correct bredth" )
	
    var someLand = _.any( _.flatten(seed), function(arr){
        return arr === gen.type['land'];
    });
    var someWater = _.any( _.flatten(seed), function(arr){
        return arr === gen.type['water'];
    });

    ok( someWater && someLand, "seed has water and land" );
    
    var map = gen.expandMap(seed);
    ok( _.all(map,function(arr){
        return arr.length == seedSize * 2;
    }), "map expanded to double size")
    
    var blnDoubled = true;
    for(var j = 0; j < seedSize; j++){
        for(var i = 0; i < seedSize; i++){
            // Check all 4 surrounding to make sure same
            if(map[j * 2][i * 2] !== seed[j][i] || 
                map[j * 2][i * 2 + 1] !== seed[j][i] ||
                map[j * 2 + 1][i * 2] !== seed[j][i] ||
                map[j * 2 + 1][i * 2 + 1] !== seed[j][i]
            ){
                blnDoubled = false;
                break;
            }
        }
    }
    ok( blnDoubled, "Map doubled correctly")
    
})