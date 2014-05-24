var http = require('http');

var helper = {
    removeDuplicates: function (list) {
        var newList = ["jeden"];

        for (var i = 0; i < list.length; i++) {
            if (list[i] !== newList[newList.length - 1]) {
                if (list[i] !== "") {
                    newList.push(list[i]);
                }

            }
        }

        return newList;
    },
    getSentence: function (url) {
        var output = url.slice(1, url.length);
        return decodeURIComponent(output);
    }
}

var sentenceProcessor = {
    processWholeSentence: function (sentence, callback) {
        var phrases = this.getPhrasesWithNumber(sentence);
        var number, word;
        var self = this;

        var currentPhrase = 0;

        var loopFunction = function () {
            phrase = phrases[currentPhrase];
            number = self.getNumberFromPhrase(phrase);
            word = self.getWordFromPhrase(phrase);



            number = digitsToWords(number);
            requestProcessor.getWordsCase(word, function (caseResult) {
                if (caseResult !== null) {
                    console.log(caseResult)
                    caseResult = caseResult[0].replace("case=", "")
                    //    console.log(caseResult)
                    var numberSplit = number.split(" ");
                    numberSplit = helper.removeDuplicates(numberSplit);
                    console.log(numberSplit);
                    var counter = numberSplit.length;

                    for (var i = 0; i < numberSplit.length; i++) {
                        (function (i) {
                            requestProcessor.getCasesForWord(numberSplit[i], function (casesMatrix) {
                                var re = new RegExp(numberSplit[i], "g");
                                //  console.log(caseResult[0]);
                                console.log(numberSplit[i] + " " + casesMatrix[caseResult]);
                                number = number.replace(numberSplit[i], casesMatrix[caseResult]);
                                counter--;
                                // console.log(number);

                                if (counter === 0) {
                                    sentence = sentence.replace(phrase, number + " " + word);
                                    currentPhrase++;
                                    if (phrases.length === currentPhrase) {
                                        sentence = sentence.replace(/\s+/g, " ")
                                        var result = {
                                            "result": sentence
                                        }
                                        callback(JSON.stringify(result));
                                        console.log(sentence);
                                    } else {
                                        loopFunction();
                                    }



                                }
                            })
                        })(i);
                    }
                }
            });

        }
        if (phrases !== null) {
            loopFunction();
        }




    },
    getPhrasesWithNumber: function (sentence) {
        return sentence.match(/\d+\s[A-Za-ząśćęóżłźŁĄŚŻŹĆĘÓ]+/g);
    },
    getNumberFromPhrase: function (phrase) {
        return phrase.match(/\d+/g);
    },
    getWordFromPhrase: function (phrase) {
        return phrase.match(/[A-Za-ząśćęóżźłŁĄŚŻŹĆĘÓ]+/g);
    }
}

var requestProcessor = {
    isWordNoun: function (word, input) {
        return input.match(word + " subst") !== null || input.match(word + " adj") !== null;
    },
    getWordsCase: function (word, callback) {
        var self = this;
        console.log(word);
        var request = http.request("http://mrt.wmi.amu.edu.pl/json.psis?pipe=morfologik+!+psi-writer+--no-header&input=" + word, function (response) {
            response.setEncoding('utf8');
            var body = "";
            response.on('data', function (chunk) {
                body += chunk;

            });
            response.on('end', function () {
                if (self.isWordNoun(word, body)) {
                    callback(body.match(/case=[a-z]+/g));

                } else {
                    callback(null);
                }

            });
        });

        request.end();




    },
    getCasesForWord: function (word, callback) {
        var request = http.request("http://www.aztekium.pl/przypadki.py?szukaj=" + word, function (response) {
            response.setEncoding('utf8');
            var body = "";
            response.on('data', function (chunk) {
                body += chunk;

            });
            response.on('end', function () {
                callback(caseMatrixGenerator.generateMatrix(body));

            });
        });
        request.end();
    }
}

var caseMatrixGenerator = {
    generateMatrix: function (data) {
        var result = {};

        var matches = data.match(/(Mianownik|Biernik|Miejscownik|Dopełniacz|Celownik|Narzędnik)<\/b>[\s\?\:\(\)<>A-Za-ząśćęóżźĄŚŻŹĆĘÓ=\"]+<td\sbgcolor=\"(#cfcfcf|#dfdfdf)\">&nbsp\;<b>[A-Za-ząśćęóżźłŁĄŚŻŹĆĘÓ]+<\/b>/g);

        matches.forEach(function (row) {
            var caseVar = row.match(/(Mianownik|Biernik|Miejscownik|Dopełniacz|Celownik|Narzędnik)/);
            caseVar = caseVar[0];

            var word = row.match(/<b>[A-Za-ząśćęóżźłŁĄŚŻŹĆĘÓ]+<\/b>/);
            word = word[0].replace("<b>", "");
            word = word.replace("<\/b>", "");

            switch (caseVar) {
            case "Mianownik":
                result.nom = word;
                break;
            case "Dopełniacz":
                result.gen = word;
                break;
            case "Celownik":
                result.dat = word;
                break;
            case "Biernik":
                result.acc = word;
                break;
            case "Narzędnik":
                result.inst = word;
                break;
            case "Miejscownik":
                result.voc = word;
                break;
            }

        });


        return result;
    }
}

function digitsToWords(digits) {
    var liczba = parseInt(digits);

    var jednosci = ["", " jeden", " dwa", " trzy", " cztery", " pięć", " sześć", " siedem", " osiem", " dziewięć"];
    var nascie = ["", " jedenaście", " dwanaście", " trzynaście", " czternaście", " piętnaście", " szesnaście", " siedemnaście", " osiemnaście", " dziewietnaście"];
    var dziesiatki = ["", " dziesięć", " dwadzieścia", " trzydzieści", " czterdzieści", " pięćdziesiąt", " sześćdziesiąt", " siedemdziesiąt", " osiemdziesiąt", " dziewięćdziesiąt"];
    var setki = ["", " sto", " dwieście", " trzysta", " czterysta", " pięćset", " sześćset", " siedemset", " osiemset", " dziewięćset"];
    var grupy = [
        ["", "", ""],
        [" tysiąc", " tysiąc", " tysiąc"],
        [" milion", " milion", " milion"],
        [" miliard", " miliard", " miliard"],
        [" bilion", " bilion", " bilion"],
        [" biliard", " biliard", " biliard"],
        [" trylion", " trylion", " trylion"]
    ];

    if (!isNaN(liczba)) {

        var wynik = '';
        var znak = '';
        if (liczba == 0)
            wynik = "zero";
        if (liczba < 0) {
            znak = "minus";
            liczba = liczba;
        }

        var g = 0;
        while (liczba > 0) {
            var s = Math.floor((liczba % 1000) / 100);
            var n = 0;
            var d = Math.floor((liczba % 100) / 10);
            var j = Math.floor(liczba % 10);
            if (d == 1 && j > 0) {
                n = j;
                d = 0;
                j = 0;
            }

            var k = 2;
            if (j == 1 && s + d + n == 0)
                k = 0;
            if (j == 2 || j == 3 || j == 4)
                k = 1;
            if (s + d + n + j > 0)
                wynik = setki[s] + dziesiatki[d] + nascie[n] + jednosci[j] + grupy[g][k] + wynik;

            g++;
            liczba = Math.floor(liczba / 1000);
        }
        return (wynik);
    }
}


http.createServer(function (req, res) {
    if (req.method === "GET") {



        var sentence = helper.getSentence(req.url);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });
        sentenceProcessor.processWholeSentence(sentence, function (content) {
            res.end(content);
        })



    }


}).listen(1337, '127.0.0.1');