/* Ensures all infomration loads and then launches the applicaiton */

//TODO: add error checking
export async function loadFiles(paths) {

    var file_downloads = []
    paths.forEach( function(path) {
        file_downloads.push(
        fetch(path).then(function(response) {
            return response.text()
        })
        )
    });
    return Promise.all(file_downloads);
}

export async function loadFile(path) {

    return fetch(path).then(function(response) {
        return response.text()
    })
}


