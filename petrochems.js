function runMod() {
    // 1. EXTRA ELEMENTS & UTILITIES
    elements.lint = {
        color: "#e1e5eb",
        behavior: behaviors.POWDER,
        category: "powders",
        state: "solid",
        density: 150,
        flammable: true,
        burnTime: 20,
        desc: "Fine, highly flammable fibrous powder. Catches fire instantly."
    };

    elements.coal_powder = {
        color: "#1c1c1c",
        behavior: behaviors.POWDER,
        category: "powders",
        state: "solid",
        density: 1300,
        flammable: true,
        burnTime: 400,
        desc: "Finely ground coal. Only ignites if its ambient temperature rises past 40°C.",
        tick: function(pixel) {
            if (pixel.temp < 40 && pixel.element === "fire") {
                pixel.element = "coal_powder";
            }
        }
    };

    // 2. THE FRACTIONS (Liquids & Gases)
    elements.gasoline = {
        color: "#fbf6d9", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 720,
        viscosity: 0.8,
        flammable: true,
        burnTime: 15, 
        fireColor: ["#ff9900", "#ffcc00"], 
        desc: "Pale yellow fuel. Ignites very fast. Shocking it or sending electricity causes instant combustion.",
        tick: function(pixel) {
            if (pixel.charge && pixel.charge > 0) {
                pixel.element = "fire";
            }
        }
    };

    elements.diesel = {
        color: "#d0f0c0", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 850,
        viscosity: 5,
        flammable: true,
        burnTime: 180, 
        fireColor: "#ff6600", 
        desc: "Pale green fuel. Slow burn at room temp, but burns fast like gasoline when heated past 50°C. Immune to shock.",
        tick: function(pixel) {
            if (pixel.temp >= 50) {
                pixel.burnTime = 15; 
            } else {
                pixel.burnTime = 180;
            }
        }
    };

    elements.kerosene = {
        color: "#afeeee", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 800,
        viscosity: 1.5,
        flammable: true,
        burnTime: 25, 
        fireColor: "#33ccff", 
        desc: "Pale turquoise fuel. Fast light blue flame. Saturates cloth, paper, and wood when touching them.",
        tick: function(pixel) {
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i]) {
                    var n = neighbors[i].element;
                    if (n === "cloth" || n === "paper" || n === "wood") {
                        neighbors[i].flammable = true;
                        neighbors[i].burnTime = 10; 
                        neighbors[i].color = "#76a5af"; 
                    }
                }
            }
        }
    };

    elements.naphtha = {
        color: "#b0f2b6", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 750,
        flammable: true,
        burnTime: 18, 
        fireColor: "#55ddff", 
        desc: "Pale green liquid. Ignites instantly when shocked or electrified. Use to manufacture plastic and rubber.",
        tick: function(pixel) {
            if (pixel.charge && pixel.charge > 0) {
                pixel.element = "fire";
                return;
            }
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i]) {
                    if (neighbors[i].element === "fire" || neighbors[i].temp > 120) {
                        changePixel(pixel, "molten_plastic");
                        break;
                    }
                    if (neighbors[i].element === "acid") {
                        changePixel(pixel, "raw_rubber");
                        deletePixel(neighbors[i].x, neighbors[i].y);
                        break;
                    }
                }
            }
        }
    };

    elements.bunker_c = {
        color: "#111111", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 980,
        viscosity: 800, 
        flammable: true,
        burnTime: 350, 
        fireColor: "#e65c00",
        desc: "Thick black heavy fuel. Slow orange flame under normal conditions, burns fast past 80°C. Only ignites with direct fire.",
        tick: function(pixel) {
            if (pixel.temp >= 80) {
                pixel.burnTime = 20; 
            } else {
                pixel.burnTime = 350;
            }
        }
    };

    elements.tar = {
        color: "#0a0a0a", 
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 1200,
        viscosity: 2000, 
        flammable: false, 
        desc: "Thick non-flammable petroleum tar residue. Mix with rock to create asphalt.",
        tick: function(pixel) {
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i]) {
                    var name = neighbors[i].element;
                    if (name === "rock" || name === "stone" || name === "concrete" || name === "gravel") {
                        changePixel(pixel, "asphalt");
                        deletePixel(neighbors[i].x, neighbors[i].y);
                        break;
                    }
                }
            }
        }
    };

    // 3. REFINERY PRODUCTS (Plastic, Rubber, Asphalt)
    elements.molten_plastic = {
        color: "#e6e6fa",
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 900,
        viscosity: 200,
        temp: 180,
        tick: function(pixel) {
            if (pixel.temp <= 60) { changePixel(pixel, "structural_plastic"); }
        }
    };

    elements.structural_plastic = {
        color: "#f0f8ff",
        behavior: behaviors.SOLID,
        category: "land",
        state: "solid",
        density: 950,
        insulate: true,
        burnTime: 100
    };

    elements.raw_rubber = {
        color: "#4a3b32",
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 910,
        tick: function(pixel) {
            if (pixel.temp >= 140) { changePixel(pixel, "rubber"); }
        }
    };

    elements.rubber = {
        color: "#242424",
        behavior: behaviors.SOLID,
        category: "land",
        state: "solid",
        density: 1100,
        insulate: true,
        desc: "Elastic industrial material. Moves when smashed and bounces right back.",
        tick: function(pixel) {
            if (!pixel.origX) { pixel.origX = pixel.x; pixel.origY = pixel.y; }
            if (pixel.x !== pixel.origX || pixel.y !== pixel.origY) {
                var dx = Math.sign(pixel.origX - pixel.x);
                var dy = Math.sign(pixel.origY - pixel.y);
                tryMove(pixel, pixel.x + dx, pixel.y + dy);
            }
        }
    };

    elements.asphalt = {
        color: "#42454a", 
        behavior: behaviors.POWDER,
        category: "powders",
        state: "solid",
        density: 1500,
        desc: "Dark gray loose mix. Smash it with a smash tool to compress it into a hard road.",
        tick: function(pixel) {
            if (pixel.velocity && (Math.abs(pixel.velocity.x) > 2 || Math.abs(pixel.velocity.y) > 2)) {
                changePixel(pixel, "road_pavement");
            }
        }
    };

    elements.road_pavement = {
        color: "#2b2d30", 
        behavior: behaviors.WALL,
        category: "land",
        state: "solid",
        density: 2300,
        hardness: 0.9,
        desc: "Compressed, dense industrial road layout."
    };
}
