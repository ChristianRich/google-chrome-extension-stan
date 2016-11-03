var currentTitle,
    infoWindow,
    timer,
    infoTemplate;

var showInfo = function(info){

    if(!info){
        return;
    }

    var contents = infoWindow.find('.contents');

    if(info.Error){
        return contents.html($('<h1>' + info.Error + '</h1>'));
    }

    var el = $.parseHTML(infoTemplate({
        title: info.Title || 'n/a',
        plot: info.Plot || '',
        imdbRating: info.imdbRating || 'n/a',
        country: info.Country || 'n/a',
        genre: info.Genre || 'n/a',
        language: info.Language || 'n/a',
        type: info.Type || 'n/a',
        year: info.Year || 'n/a',
        imdbVotes: info.imdbVotes || 'n/a'
    }));

    contents.html($(el));

    var img = document.getElementById('imdbLogo');
    img.src = chrome.extension.getURL('assets/imdb-logo.png');
};

var init = function(){

    window.removeEventListener('load', init, false);

    $.ajax({
        url: chrome.extension.getURL('assets/infoWindowContent.html')
    })

    .done(function(response) {

        // The dynamic html template going into the infoWindow
        infoTemplate = _.template(response);

        $.ajax({
            url: chrome.extension.getURL('assets/infoWindowOuter.html')
        })

        .done(function(html){

            infoWindow = $(html);

            infoWindow.find('.close').on('click', function(){
                infoWindow.addClass('hidden');
            });

            $('body').append(infoWindow);

            $('li.programs__item').hover(
                hoverIn,
                hoverOut
            );
        })

        .catch(function(err){
            console.log(err)
        });
    })

    .catch(function(err){
        console.log(err)
    });

    var hoverIn = function(){

        var title = $(this).find('h5 a');

        if(currentTitle === title[0].textContent){
            return;
        }

        currentTitle = title[0].textContent;

        if(!currentTitle){
            throw new Error('Unable to get title from card');
        }

        if(timer){
            clearTimeout(timer);
        }

        timer = setTimeout(function(){
            timer = null;
            loadRating(currentTitle);
        }, 1000);
    };

    var hoverOut = function(){
        currentTitle = null;

        if(timer){
            clearTimeout(timer);
        }
    }
};

var loadRating = function(title){

    if(!title){
        return console.log('loadRating: No title');
    }

    infoWindow.removeClass('hidden');
    infoWindow.find('.loading').removeClass('hidden');

    chrome.storage.local.get(title, function(items){

        items = items[title];

        if(items && items.Title){
            infoWindow.find('.loading').addClass('hidden');
            return showInfo(items);
        }

        fetchImdb(title);
    });
};

var fetchImdb = function(title){

    $.ajax({
        url: '//omdbapi.com/?t=' + encodeURIComponent(title) + '&y=&plot=short&r=json'
    })

    .done(function(response) {

        infoWindow.find('.loading').addClass('hidden');

        if(response && !response.Error){

            var o = {};
            o[response.Title] = response;

            return chrome.storage.local.set(o, function(){
                showInfo(response);
            });
        }

        showInfo(response);
    })

    .catch(function(){

        infoWindow.find('.loading').addClass('hidden');

        showInfo({
            Error: 'Error loading IMDB info'
        });
    })
};

window.addEventListener('load', init, false);
