var State = function () {
    var Chicken = function () {
        function Chicken() {
            $("#content").append("<div id=\"chicken\" class=\"message\"><div><p></p><button>Play Again</button></div></div>");
            $("#chicken button").click(function () {
                $(this).attr("disabled", "disabled");
                Controller.notify("play_again");
            });
        }

        Chicken.prototype.enter = function () {
            $("#chicken button").removeAttr("disabled");
            $("#chicken").stop().fadeIn("fast", function () {}).css("display", "table-cell");
            return this;
        };

        Chicken.prototype.exit = function () {
            $("#chicken").stop().fadeOut("fast", function () {});
            return this;
        };

        Chicken.prototype.setText = function (msg) {
            $("#chicken p").text(msg);
            return this;
        };

        return new Chicken();
    }();

    var Loading = function () {
        function Loading() {
            $("#content").append("<div id=\"loading\" class=\"message\"><div><p></p><img src=\"img/spinner.gif\" /></div></div>");
        }

        Loading.prototype.enter = function () {
            $("#loading").stop().fadeIn("fast", function () {}).css("display", "table-cell");
            return this;
        };

        Loading.prototype.exit = function () {
            $("#loading").stop().fadeOut("fast", function () {});
            return this;
        };

        Loading.prototype.setText = function (msg) {
            $("#loading p").text(msg);
            return this;
        };

        return new Loading();
    }();

    var Game = function () {
        var canvas;
        var context;

        var MAP_OFFSET_X = 12;
        var MAP_OFFSET_Y = 32;
        var COLORS = {
            1 : "#06266f",
            2 : "#078600",
            3 : "#a60400",
            4 : "#4c036e",
            5 : "#a63100",
            6 : "#04859d",
            7 : "#443425",
            8 : "#333333"
        };

        function Game() {
            $("#content").append("<div id=\"game\"></div>");
            $("#game").append("<canvas id=\"canvas\" width=\"408\" height=\"428\"></canvas>");
            $("#game").append("<div id=\"announcement\"><div><img /><p></p><button>Play Again</button></div></div>");

            canvas = $("#game canvas").get(0);
            context = canvas.getContext("2d");

            canvas.addEventListener("mousemove", ev_mousemove, false);
            canvas.addEventListener("mousedown", ev_mousedown, false);
            canvas.onselectstart = function () { return false; };

            Controller.listen("model_init", render);
            Controller.listen("model_updated", render);
            Controller.listen("game_win", function () {
                renderAnnouncement(Resources.getImage("win"), "You Win!", Resources.getSound("sndwin"));
            });
            Controller.listen("game_lose", function () {
                renderAnnouncement(Resources.getImage("lose"), "You Lose!", Resources.getSound("sndlose"));
            });
            Controller.listen("game_draw", function () {
                renderAnnouncement(Resources.getImage("draw"), "Draw!");
            });

            $("#announcement button").click(function () {
                $(this).attr("disabled", "disabled");
                Controller.notify("play_again");
            });
        }

        Game.prototype.enter = function () {
            $("#announcement").hide();
            $("#game canvas").css({ opacity : 1.0 }).show();
            $("#game").stop().fadeIn("slow", function () {});
            return this;
        };

        Game.prototype.exit = function () {
            $("#game").stop().fadeOut("slow", function () {});
            return this;
        };

        function render() {
            clearCanvas();
            renderScoreboard();
            renderMap();
            renderCursors(Model.getMyCursor(), Model.getOpCursor());
        };

        function clearCanvas() {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        function renderScoreboard() {
            context.drawImage(Resources.getImage("blueflag"), MAP_OFFSET_X+5, 10);
            context.fillStyle = "#443425";
            context.font = "bold 20px sans-serif";
            context.textAlign = "left";
            context.fillText(Model.getMyScore(), MAP_OFFSET_X+29, 26);

            context.drawImage(Resources.getImage("redflag"), MAP_OFFSET_X+16*24-23, 10);
            context.fillStyle = "#443425";
            context.font = "bold 20px sans-serif";
            context.textAlign = "right";
            context.fillText(Model.getOpScore(), MAP_OFFSET_X+16*24-29, 26);

            context.fillStyle = "#443425";
            context.font = "bold 12px sans-serif";
            context.textAlign = "center";
            context.fillText(Model.isMyTurn() ? "It's your turn" : "Please wait...", canvas.width/2, 23);
        }

        function renderMap() {
            for(var i = 0; i < 16; i++) {
                for(var j = 0; j < 16; j++) {
                    var cell = Model.getMapCell(i, j);
                    if(cell == -3)
                        context.drawImage(Resources.getImage("button"),
                                MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j);
                    else {
                        context.drawImage(Resources.getImage("tile"),
                                MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j);
                        if(cell > 0 || cell === "A" || cell === "B") {
                            if(cell >= 1 && cell <= 8) {
                                context.fillStyle = COLORS[cell];
                                context.font = "bold 18px sans-serif";
                                context.textAlign = "center";
                                context.fillText(cell, MAP_OFFSET_X+24*i+12, MAP_OFFSET_Y+24*j+18);
                            } else if(cell === "A") {
                                context.drawImage(Resources.getImage("blueflag"),
                                        MAP_OFFSET_X+24*i+3, MAP_OFFSET_Y+24*j+2);
                            } else if(cell === "B") {
                                context.drawImage(Resources.getImage("redflag"),
                                        MAP_OFFSET_X+24*i+3, MAP_OFFSET_Y+24*j+2);
                            }
                        }
                    }
                }
            }
        }

        function renderCursors(myCursor, opCursor) {
            if(opCursor)
                context.drawImage(Resources.getImage("redcursor"),
                        MAP_OFFSET_X+24*opCursor.x, MAP_OFFSET_Y+24*opCursor.y);
            if(myCursor)
                context.drawImage(Resources.getImage("bluecursor"),
                        MAP_OFFSET_X+24*myCursor.x, MAP_OFFSET_Y+24*myCursor.y);
        }

        function renderAnnouncement(img, msg, snd) {
            $("#game canvas").stop().fadeTo("slow", 0.2, function () {});
            $("#announcement img").replaceWith($(img).clone());
            $("#announcement p").text(msg);
            $("#announcement button").removeAttr("disabled");
            $("#announcement").stop().fadeIn("slow", function () {
                if(snd !== undefined) snd.play();
            }).css("display", "table-cell");
        }

        function ev_mousemove(ev) {
            var c = canvas.relMouseCoords(ev);

            if(!Model.isMyTurn())
                return;

            c.x = Math.floor((c.x-MAP_OFFSET_X)/24);
            c.y = Math.floor((c.y-MAP_OFFSET_Y)/24);

            if(c.x >= 0 && c.x < 16 && c.y >= 0 && c.y < 16)
                Model.setMyCursor(c);
        }

        function ev_mousedown(ev) {
            var c = canvas.relMouseCoords(ev);

            if(!Model.isMyTurn())
                return;

            c.x = Math.floor((c.x-MAP_OFFSET_X)/24);
            c.y = Math.floor((c.y-MAP_OFFSET_Y)/24);

            if(c.x >= 0 && c.x < 16 && c.y >= 0 && c.y < 16) {
                if(Model.getMapCell(c.x, c.y) !== -3) return;
                Model.setMapCell(c.x, c.y, 0);
                Model.setMyTurn(false);
                Model.setMyCursor(c);
                Network.shoot(c);
                Resources.getSound("sndshoot").play();
            }
        }

        return new Game();
    }();

    return {
        Chicken : Chicken,
        Loading : Loading,
        Game : Game,
    };
}();
