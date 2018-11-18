/* global toWatch */
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

var imdb = require('imdb-api');
var moment = require('moment');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

//
bot.dialog('/', [
    function(session) {
        session.say("Welcome to Movie Database.", "Welcome to Movie Database");
        session.beginDialog('searchMovie');
    } 
]);

bot.dialog('searchMovie', [
    function (session) {
        session.beginDialog('askForMovieName');
    },
    function (session, results) {
        var query = results.response;
        session.say("You searched for \'" + query + "\'.", "You searched for \'" + query + "\'.");
        imdb.search({ title: query }, { apiKey: 'ca3f621c'})
        .then(response => {
            var movies = response;
            var movie1;
            var movie2;
            var movie3;
            if (movies.totalresults == 0) {session.say("I couldn't find anything.", "I couldn't find anything.")}
            else {
                imdb.getById(movies.results[0].imdbid, {apiKey: 'ca3f621c', timeout: 30000})
                .then(response => {
                    movie1 = response;
                    imdb.getById(movies.results[1].imdbid, {apiKey: 'ca3f621c', timeout: 30000})
                    .then(response => {
                        movie2 = response;
                        imdb.getById(movies.results[2].imdbid, {apiKey: 'ca3f621c', timeout: 30000})
                            .then(response => {
                            movie3 = response;
                            var msg1 = new builder.Message(session)
                            .speak("Here are the top three results for " + query + ".")
                            .addAttachment({
                                contentType: "application/vnd.microsoft.card.adaptive",
                                content: {
                                    type: "AdaptiveCard",
                                    size: "extraLarge",
                                    body: [
                                        {
                                			"type": "ColumnSet",
                                			"columns": [
                                				{
                                					"type": "Column",
                                					"items": [
                                						{
                                							"type": "Image",
                                							"url": movie1.poster,
                                                            "size": "auto"
                                						},
                                						{
                                							"type": "TextBlock",
                                                            "style": "wrap",
                                							"text": movie1.title.substr(0,13)
                                						},
                                                        {
                                                            "type": "TextBlock",
                                                            "style": "wrap",
                                                            "isSubtle": true,
                                                            "text": movie1._year_data  
                                                        }   
                                					]
                                				},
                                				{
                                					"type": "Column",
                                					"items": [
                                						{
                                							"type": "Image",
                                							"url": movie2.poster,
                                                            "size": "auto"
                                						},
                                						{
                                							"type": "TextBlock",
                                                            "style": "wrap",
                                							"text": movie2.title.substr(0,13)
                                						},
                                                        {
                                                            "type": "TextBlock",
                                                            "style": "wrap",
                                                            "isSubtle": true,
                                                            "text": movie2._year_data  
                                                        }
                                					]
                                				},
                                				{
                                					"type": "Column",
                                					"items": [
                                						{
                                							"type": "Image",
                                							"url": movie3.poster,
                                                            "size": "auto"
                                						},
                                						{
                                							"type": "TextBlock",
                                                            "style": "wrap",
                                							"text": movie3.title.substr(0,13)
                                						},
                                                        {
                                                            "type": "TextBlock",
                                                            "style": "wrap",
                                                            "isSubtle": true,
                                                            "text": movie3._year_data  
                                                        }
                                					]
                                				}
                                			]
                                		}
                                    ],
                                    "actions": [
                                        {
                                            "type": "Action.ShowCard",
                                            "title": "More",
                                            "card": {
                                                "type": "AdaptiveCard",
                                                "body": [
                                                    {
                                                        "type": "TextBlock",
                                                        "size": "extraLarge",
                                                        "wrap": true,
                                                        "text": movie1.title
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "isSubtle": true,
                                                        "text": movie1.rated + " | " + movie1._year_data + " | " + movie1.genres + " | " + movie1.runtime
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "IMDb Rating: " + movie1.rating
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie1.plot
                                                    },
                                                   {
                                                    "type": "FactSet",
                                                    "separator": true,
                                                        "facts": [
                                                            {
                                                                "title": "Release Date:",
                                                                "value": moment(movie1.released).format("d MMM YYYY")
                                                            },
                                                            {
                                                                "title": "Director:",
                                                                "value": movie1.director
                                                            },
                                                            {
                                                                "title": "Languages:",
                                                                "value": movie1.languages
                                                            },
                                                            {                                                            
                                                                "title": "Country:",
                                                                "value": movie1.country
                                                            }
                                                        
                                                        ]
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Writers:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie1.writer
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Actors:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie1.actors
                                                    }
                                                ],
                                         "actions": [
                        					{
                        						"type": "Action.Submit",
                        						"title": "Add to",
                                                "data": 
                                                {
                                                toWatch.push(movie1.title)
                                                }
                        					}
                        				]
                                            } 
                                        },
                                        {
                                            "type": "Action.ShowCard",
                                            "title": "More",
                                            "card": {
                                                "type": "AdaptiveCard",
                                                "body": [
                                                    {
                                                        "type": "TextBlock",
                                                        "size": "extraLarge",
                                                        "wrap": true,
                                                        "text": movie2.title
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "isSubtle": true,
                                                        "text": movie2.rated + " | " + movie2._year_data + " | " + movie2.genres + " | " + movie2.runtime
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "IMDb Rating: " + movie2.rating
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie2.plot
                                                    },
                                                    {
                                                    "type": "FactSet",
                                                    "separator": true,
                                                        "facts": [
                                                            {
                                                                "title": "Release Date:",
                                                                "value": moment(movie2.released).format("d MMM YYYY")
                                                            },
                                                            {
                                                                "title": "Director:",
                                                                "value": movie2.director
                                                            },
                                                            {
                                                                "title": "Languages:",
                                                                "value": movie2.languages
                                                            },
                                                            {                                                            
                                                                "title": "Country:",
                                                                "value": movie2.country
                                                            }
                                                        
                                                        ]
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Writers:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie2.writer
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Actors:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie2.actors
                                                    }
                                                ],
                                          "actions": [
                        					{
                        						"type": "Action.Submit",
                        						"title": "Add to"
                        					}
                        				]                                               
                                            } 
                                        },
                                        {
                                            "type": "Action.ShowCard",
                                            "title": "More",
                                            "card": {
                                                "type": "AdaptiveCard",
                                                "body": [
                                                    {
                                                        "type": "TextBlock",
                                                        "size": "extraLarge",
                                                        "wrap": true,
                                                        "text": movie3.title
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "isSubtle": true,
                                                        "text": movie3.rated + " | " + movie3._year_data + " | " + movie3.genres + " | " + movie3.runtime
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "IMDb Rating: " + movie3.rating
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie3.plot
                                                    },
                                                    {
                                                        "type": "FactSet",
                                                        "facts": [
                                                            {
                                                                "title": "Release Date:",
                                                                "value": moment(movie3.released).format("d MMM YYYY")
                                                            },
                                                            {
                                                                "title": "Director:",
                                                                "value": movie3.director
                                                            },
                                                            {
                                                                "title": "Languages:",
                                                                "value": movie3.languages
                                                            },
                                                            {
                                                                "title": "Country:",
                                                                "value": movie3.country
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Writers:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie3.writer
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "weight": "bolder",
                                                        "text": "Actors:"
                                                    },
                                                    {
                                                        "type": "TextBlock",
                                                        "wrap": true,
                                                        "text": movie3.actors
                                                    }
                                                ],
                                           "actions": [
                        					   {
                        						  "type": "Action.Submit",
                        						  "title": "Add to"
                        					   }
                    				        ]                                               
                                            } 
                                        }
                                    ]
                                }
                            });
                            session.send(msg1);
                            });
                        });
                    });
                });
            }
        });
    }
])
.reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$|^restart$|^again$/i,
    confirmPrompt: "Are you sure?"
});

bot.dialog('askForMovieName', [
    function (session) {
        builder.Prompts.text(session, "What movie would you like to search for?", {
            speak: "What movie would you like to search for?"
        });
    },
    function (session, results) {
        session.endDialogWithResult(results);       
    }
]);
