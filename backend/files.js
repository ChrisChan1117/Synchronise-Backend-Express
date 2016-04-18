// An helper to manage files on S3
// Nothing really exciting here
var path          = require('path');
var AWS           = require('aws-sdk');
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var assets        = require(path.normalize(__dirname + '/../helpers/assets'));

exports.getSignature = function(request, response){
    AWS.config.update(assets.AWSCredentials);

    orm.model("User").then(function(User){
        var user = User.current(request);

        var date = new Date();
        var filename = date.getTime()+assets.randomString(15);
        var s3 = new AWS.S3();

        var s3_params = {
            Bucket: request.params.folder,
            Key: ""+filename,
            Expires: 60,
            ContentType: request.params.file_type,
            ACL: 'public-read'
        };

        s3.getSignedUrl('putObject', s3_params, function(err, data){
            if(err){
                response.error(err);
            }else{
                var return_data = {
                    signed_request: data,
                    filename: filename,
                    contentType: request.params.file_type,
                    folder: request.params.folder,
                    url: 'https://'+request.params.folder+'.s3.amazonaws.com/'+filename
                };
                response.success(return_data);
            }
        });
    });
};
