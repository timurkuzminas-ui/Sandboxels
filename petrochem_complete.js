if (enabledMods.includes("petrochem_complete.js")) {

    // ==========================================
    // 1. DATA STRUCTURES AND CORE STATES
    // ==========================================
    
    // Custom global tracker for tracking clicked/smashed states if needed
    if (!window.petrochemState) {
        window.petrochemState = {
            isSmashed: false
        };
    }

    // Capture tool activations to simulate smashing/mouse clicks for Rubber and Asphalt
    window.addEventListener("mousedown", function() { window.petrochemState.isSmashed = true; });
    window.addEventListener("mouseup", function() { window.petrochemState.isSmashed = false; });
    window.addEventListener("touchstart", function() { window.petrochemState.isSmashed = true; });
    window.addEventListener("touchend", function() { window.petrochemState.isSmashed = false; });

    // ==========================================
    // 2. PETROLEUM FRACTIONS & PRODUCTS
    // ==========================================

    // GASOLINE
    elementGrid.gasoline = {
        color: "#fdfbe4", // White with a yellow hint / pale yellow
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 720,
        viscosity: 0.8,
        flammable: true,
        burnTime: 15,          // Fast burn
        fireColor: ["#ff9900", "#ffcc00"], // Orange/yellow flame
        desc: "Pale yellow fuel. Fast burn with orange/yellow flame. Ignites via shock tool or electricity.",
        tick: function(pixel) {
            // Ignition by neighboring shock/electricity
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i] && (neighbors[i].element === "shock" || neighbors[i].element === "electricity" || neighbors[i].element === "flash")) {
                    pixel.element = "fire";
                    pixel.fireColor = ["#ff9900", "#ffcc00"];
                    break;
                }
            }
        }
    };

    // DIESEL
    elementGrid.diesel = {
        color: "#dff2e2", // Very pale green liquid
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 850,
        viscosity: 5,
        flammable: true,
        desc: "Very pale green liquid. Orange flame. Slow burn normally, fast burn like gasoline past 50C. Immune to shock ignition.",
        tick: function(pixel) {
            if (pixel.temp >= 50) {
                pixel.burnTime = 15; // Fast burn like gasoline
            } else {
                pixel.burnTime = 120; // Slow burn
            }
            
            // Traditional flame logic (ignites only via heat/fire, rejects shock)
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i] && neighbors[i].element === "fire") {
                    pixel.element = "fire";
                    pixel.fireColor = "#ff5500"; // Orange flame
                    break;
                }
            }
        }
    };

    // KEROSENE
    elementGrid.kerosene = {
        color: "#e2f9f5", // Pale turquoise liquid
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 800,
        viscosity: 1.5,
        flammable: true,
        burnTime: 20, // Fast flame
        fireColor: ["#4da6ff", "#0066ff"], // Light blue flame
        desc: "Pale turquoise liquid. Light blue fast flame. Cannot be shocked to ignite. Saturates cloth, paper, and wood on contact.",
        tick: function(pixel) {
            var directions = [
                {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
            ];
            for (var i = 0; i < directions.length; i++) {
                var adj = getPixel(pixel.x + directions[i].x, pixel.y + directions[i].y);
                if (adj && (adj.element === "cloth" || adj.element === "paper" || adj.element === "wood")) {
                    // Turn them flammable or mimic saturation by converting them or applying flame parameters
                    adj.flammable = true;
                    adj.burnTime = 10; 
                }
            }
            
            // Regular fire ignition only
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var j = 0; j < neighbors.length; j++) {
                if (neighbors[j] && neighbors[j].element === "fire") {
                    pixel.element = "fire";
                    pixel.fireColor = ["#4da6ff", "#0066ff"];
                    break;
                }
            }
        }
    };

    // NAPHTHA
    elementGrid.naphtha = {
        color: "#e6f7e9", // Pale green liquid
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 750,
        viscosity: 1,
        flammable: true,
        burnTime: 15, // Fast flame
        fireColor: ["#66b2ff", "#3399ff"], // Light blue flame
        desc: "Pale green liquid. Light blue fast flame. Very easily ignites when shocked. Feedstock for plastics and rubber.",
        tick: function(pixel) {
            // Shock tool / Electricity ignition
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i] && (neighbors[i].element === "shock" || neighbors[i].element === "electricity" || neighbors[i].element === "fire" || neighbors[i].element === "flash")) {
                    pixel.element = "fire";
                    pixel.fireColor = ["#66b2ff", "#3399ff"];
                    break;
                }
                
                // Polymerization reaction triggers
                if (neighbors[i]) {
                    if (neighbors[i].element === "acid") {
                        changePixel(pixel, "raw_rubber");
                        deletePixel(neighbors[i].x, neighbors[i].y);
                        break;
                    }
                    if (neighbors[i].element === "fire" || neighbors[i].temp > 150) {
                        changePixel(pixel, "molten_plastic");
                        break;
                    }
                }
            }
        }
    };

    // BUNKER C
    elementGrid.bunker_c = {
        color: "#0f0f0f", // Black viscous liquid
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 980,
        viscosity: 900,
        flammable: true,
        desc: "Black viscous liquid. Orange slow flame (burns fast past 80C). Only ignites directly with fire.",
        tick: function(pixel) {
            if (pixel.temp >= 80) {
                pixel.burnTime = 20; // Fast burn
            } else {
                pixel.burnTime = 250; // Slow burn
            }

            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i] && neighbors[i].element === "fire") {
                    pixel.element = "fire";
                    pixel.fireColor = "#e64a19"; // Orange flame
                    break;
                }
            }
        }
    };

    // TAR
    elementGrid.tar = {
        color: "#050505", // Black viscous liquid
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 1200,
        viscosity: 2000,
        flammable: false, // Does not burn
        desc: "Black viscous liquid. Does not burn. Makes asphalt when mixed with rock or concrete.",
        tick: function(pixel) {
            var neighbors = [
                getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
            ];
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i] && (neighbors[i].element === "rock" || neighbors[i].element === "concrete" || neighbors[i].element === "stone")) {
                    changePixel(pixel, "asphalt");
                    deletePixel(neighbors[i].x, neighbors[i].y);
                    break;
                }
            }
        }
    };

    // ==========================================
    // 3. COAL & STRUCTURAL PRODUCTS
    // ==========================================

    // COAL
    elementGrid.coal = {
        color: "#1c1c1c", // Black powder
        behavior: behaviors.POWDER,
        category: "solids",
        state: "solid",
        density: 1300,
        desc: "Black powder that slowly ignites only when past 40C.",
        tick: function(pixel) {
            if (pixel.temp >= 40) {
                var neighbors = [
                    getPixel(pixel.x+1, pixel.y), getPixel(pixel.x-1, pixel.y),
                    getPixel(pixel.x, pixel.y+1), getPixel(pixel.x, pixel.y-1)
                ];
                for (var i = 0; i < neighbors.length; i++) {
                    if (neighbors[i] && (neighbors[i].element === "fire" || neighbors[i].element === "flash" || neighbors[i].temp >= 100)) {
                        pixel.element = "fire";
                        pixel.burnTime = 500; // Slowly ignites / burns a long time
                        break;
                    }
                }
            }
        }
    };

    // ASPHALT
    elementGrid.asphalt = {
        color: "#333333", // Dark gray powder
        behavior: behaviors.POWDER,
        category: "solids",
        state: "solid",
        density: 1500,
        desc: "Dark gray powder. Turns into a solid road structure when smashed/clicked.",
        tick: function(pixel) {
            // If the user clicks or smashes the screen over this pixel, solidify it
            if (window.petrochemState.isSmashed) {
                changePixel(pixel, "stone"); // Converts to hard road (stone behavior)
                pixel.color = "#222222";     // Deep permanent road color
            }
        }
    };

    // SYNTHETIC RUBBER (Elastic Behavior)
    elementGrid.industrial_rubber = {
        color: "#2b2b2b",
        behavior: behaviors.SOLID,
        category: "solids",
        state: "solid",
        density: 1100,
        desc: "Elastic vulcanized rubber. Moves when smashed and springs back when released.",
        tick: function(pixel) {
            if (!pixel.originalX) { pixel.originalX = pixel.x; pixel.originalY = pixel.y; }
            
            if (window.petrochemState.isSmashed) {
                // Displace slightly downward or outward to simulate getting squished
                if (Math.random() > 0.6) {
                    var newX = pixel.x + (Math.random() > 0.5 ? 1 : -1);
                    var newY = pixel.y + 1;
                    if (isEmpty(newX, newY)) {
                        movePixel(pixel, newX, newY);
                    }
                }
            } else {
                // Snap back toward its original structure coords when you let go
                if (pixel.x !== pixel.originalX || pixel.y !== pixel.originalY) {
                    var stepX = pixel.x > pixel.originalX ? -1 : (pixel.x < pixel.originalX ? 1 : 0);
                    var stepY = pixel.y > pixel.originalY ? -1 : (pixel.y < pixel.originalY ? 1 : 0);
                    if (isEmpty(pixel.x + stepX, pixel.y + stepY)) {
                        movePixel(pixel, pixel.x + stepX, pixel.y + stepY);
                    }
                }
            }
        }
    };

    // INTERMEDIATE POLYMERS FROM NAPHTHA
    elementGrid.raw_rubber = {
        color: "#5c5146",
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 920,
        viscosity: 800,
        tick: function(pixel) {
            if (pixel.temp >= 140) { changePixel(pixel, "industrial_rubber"); }
        }
    };

    elementGrid.molten_plastic = {
        color: "#e6e6fa",
        behavior: behaviors.LIQUID,
        category: "liquids",
        state: "liquid",
        density: 900,
        viscosity: 300,
        temp: 200,
        tick: function(pixel) {
            if (pixel.temp <= 60) { changePixel(pixel, "structural_plastic"); }
        }
    };

    elementGrid.structural_plastic = {
        color: "#f0f8ff",
        behavior: behaviors.SOLID,
        category: "solids",
        state: "solid",
        density: 950
    };

    // ==========================================
    // 4. CRUDE OIL DISTILLATION LINK
    // ==========================================
    if (elementGrid.oil) {
        elementGrid.oil.tick = function(pixel) {
            if (pixel.temp >= 350) {
                changePixel(pixel, Math.random() > 0.5 ? "gasoline" : "naphtha");
            } else if (pixel.temp >= 250) {
                changePixel(pixel, "kerosene");
            } else if (pixel.temp >= 180) {
                changePixel(pixel, "diesel");
            } else if (pixel.temp >= 120) {
                changePixel(pixel, "bunker_c");
            } else if (pixel.temp >= 70) {
                changePixel(pixel, "tar");
            }
        };
    }

    // Register all elements
    createElement(elementGrid.gasoline);
    createElement(elementGrid.diesel);
    createElement(elementGrid.kerosene);
    createElement(elementGrid.naphtha);
    createElement(elementGrid.bunker_c);
    createElement(elementGrid.tar);
    createElement(elementGrid.coal);
    createElement(elementGrid.asphalt);
    createElement(elementGrid.raw_rubber);
    createElement(elementGrid.industrial_rubber);
    createElement(elementGrid.molten_plastic);
    createElement(elementGrid.structural_plastic);
}