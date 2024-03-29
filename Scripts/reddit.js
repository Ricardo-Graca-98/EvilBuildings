 //Dowload module
var download = require('./downloadURL.js');

//File management
var fs = require('fs');
var rimraf = require('rimraf');

//Check format
function checkFormat(posts, i, postNumber, callback)
{
    var fileFormat = "";
    for(var j = posts[i].url.length - 1; j > 0; j--)
    {
        if(posts[i].url[j] != ".")
        {
            fileFormat += posts[i].url[j];
        }
        else 
        {
            break;
        }
    }

    //Reverse string
    fileFormat = fileFormat.split("");
    fileFormat = fileFormat.reverse();
    fileFormat = fileFormat.join("");

    console.log(fileFormat);
    //Check file extension
    if(fileFormat.length == 3)
    {
        callback([1, fileFormat]);
    }
    else 
    {
        console.log("Deleting directory");
        console.log('./Posts/' + postNumber);
        rimraf('./Posts/' + postNumber, function () 
        {
            console.log('Directory ' + postNumber + " deleted!"); 
            callback([0, ""]);
        });
    }
}

//Create directory
function createDir(path, callback)
{
    if(!fs.existsSync(path))
    {
        fs.mkdirSync(path, function(){callback();});
        callback();
    }
    else {callback();}
}

//Create file
function createFile(path, data, callback)
{
    if(!fs.existsSync(path))
    {
        fs.writeFileSync(path, data, function(){callback();});
    }
    else {callback();}
}

//Get locations
function checkLocation(countriesList, citiesList, content, callback)
{
    content = content.replace(/[^\w\s]/gi, '')
    splitContent = content.split(" ");
    function loopData(splitContent, callback)
    {
        var data = "";

        function getCity(data, callback)
        {
            for(var i = 0; i < splitContent.length; i++)
            {
                for(var j = 0; j < citiesList.length; j++)
                {
                    var citiesLists = citiesList[j];
                    if(splitContent[i] == citiesList[j][0])
                    {
                        data += splitContent[i] + ", " + citiesList[j][1];
                    }
                }
            }
            callback(data);
        }
        
        console.log("*-------------------*");
        console.log(data);
        getCity(data, function(city)
        {
            data += city;
            callback(data);
        })
    }
    
    loopData(splitContent, function(data)
    {
        callback(data);
    });
}

//Create post
function createPost(posts, postNumber, i, countriesList, citiesList, callback)
{
    function getPath(callback)
    {
        var path = __dirname.split("/");
        path.splice(-1, path.length-1);
        path = path.join("/");
        callback(path);
    }

    getPath(function(data)
    {
        console.log("createDir");
        createDir(data + '/Posts/' + postNumber, function()
        {
            console.log("SUCCESS");
            console.log("createFile");
            checkLocation(countriesList, citiesList, posts[i].title, function(data)
            {
                createFile('./Posts/' + postNumber + '/title.txt', data, function()
                {
                    console.log("SUCCESS");
                    console.log("checkFormat");
                    checkFormat(posts, i, postNumber, function(data)
                    {
                        console.log(data);
                        if(data[0] != 0)
                        {
                            console.log("Downloading " + postNumber);
                            createFile('./Posts/' + postNumber + '/config.txt', data[1], function()
                            {
                                if(data[0] && data[1] != "")
                                {
                                    download.get(posts[i].url, './Posts/' + postNumber + '/image.' + data[1], function()
                                    {
                                        callback(postNumber); 
                                    });
                                }
                                else 
                                {
                                    callback((postNumber + " FAILED "));
                                }
                            });
                        }
                        else
                        {
                            callback(postNumber);
                        }
                    });
                });
            });
        });
    })
}

//Get posts
function getPosts(reddit, subreddit, posts_per_day, postNumber, countriesList, citiesList, callback)
{
    reddit.getSubreddit(subreddit, posts_per_day).getRising().then(posts => 
    {
        for(var i = 1; i < posts_per_day; i++)
        {
            createPost(posts, postNumber, i, countriesList, citiesList, function(data)
            {
                console.log("Post " + data + " DOWNLOADED");
            });
            console.log(postNumber);
            postNumber++;
        }
        callback();
        fs.writeFileSync('./Posts/Counter.txt', postNumber);
    });
}

module.exports =
{
    //Download and organize reddit posts from r/evilbuildings
    collect: function(reddit, subreddit, posts_per_day, postNumber, countriesList, citiesList, callback)
    {
        getPosts(reddit, subreddit, posts_per_day, postNumber, countriesList, citiesList, function()
        {
            console.log("Collect SUCCESSFUL");
            callback();
        });
    }
}