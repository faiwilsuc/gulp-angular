/**Plugins */
var gulp = require('gulp')
    webserver = require('gulp-webserver'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    inject = require('gulp-inject'),
    angularTemplateCache = require('gulp-angular-templatecache'),
    mainBowerFiles = require('main-bower-files'),
    series = require('stream-series'),
    concatCss = require('gulp-concat-css'),
    minifyCss = require('gulp-minify-css'),
    watch = require('gulp-watch'),
    clean = require('gulp-clean');

/**Configuration */
var configuration = {};

configuration.server = {};
configuration.server.port = 1337;
configuration.server.host = '0.0.0.0',
configuration.server.fallback = 'index.html',
configuration.server.livereload = true,
configuration.server.proxies = [{
    source: '/api', target: 'http://' + configuration.server.host + ':' + configuration.server.port + '/api'
}];

configuration.applicationJavascript = 'app/**/*.js';
configuration.applicationStylesheets = '';
configuration.angularTemplates = 'app/**/*.html';
configuration.buildParent = './dist';
configuration.buildApplicationJavascript = '/js';
configuration.buildVendorJavascript = '/js/vendor';

/** Tasks */

//Build application javascript
gulp.task('javascript:build', function (callback) {
    
    gulp.src(configuration.applicationJavascript)
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(configuration.buildParent + configuration.buildApplicationJavascript))
        .on('end', callback);
    
});

//Build vendor javascript
gulp.task('javascript:vendor', function(){

    var lessRegEx = (/.*\.js$/i);
    
    return gulp.src(mainBowerFiles({filter:lessRegEx}))
        .pipe(concat('vendor.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest("./dist/js/vendor"))

});

//Compile Angular templates
gulp.task('angular:templates', function(callback){
    
    gulp.src(['app/**/*.html'])
        .pipe(angularTemplateCache('templates.min.js', {module:'ngGulp', root:'app'}))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'))
        .on('end', callback);
  
});

//Build application stylesheets
gulp.task('css:build', function () {
  return gulp.src(['./styles/*.css', './app/**/*.css'])
    .pipe(concatCss("app.min.css"))
    .pipe(minifyCss({compatibility: 'ie19'}))
    .pipe(gulp.dest('./dist/css/'));
});

//Build vendor stylesheets
gulp.task('css:vendor', function () {

    var lessRegEx = (/.*\.css$/i);
    
    return gulp.src(mainBowerFiles({filter:lessRegEx}))
        .pipe(concatCss("vendor.min.css"))
        .pipe(minifyCss({compatibility: 'ie9'}))
        .pipe(gulp.dest('./dist/css/'));
    
});

//Compile and move index.html
gulp.task('html:index', ['javascript:vendor', 'javascript:build', 'angular:templates', 'css:build', 'css:vendor'], function(){
  
    var target = gulp.src('index.html'),
        appScripts = gulp.src('./dist/js/*.js'),
        vendorScripts = gulp.src('./dist/js/vendor/*.js'),
        appStyles = gulp.src('./dist/css/*.css');
    
    return target.pipe(inject(series(vendorScripts, appScripts, appStyles), {ignorePath: 'dist', addRootSlash: false }))
        .pipe(gulp.dest('./dist'));
});

//Watch for changes
gulp.task('watch', ['clean'],function () {
    gulp.watch('./app/**/*.js', ['javascript:build']);
    gulp.watch(['./styles/*.css', './app/**/*.css'], ['css:build']);
});

//Start a server
gulp.task('serve', ['html:index', 'watch'], function() {

    gulp.src('./dist/')
      .pipe(webserver(configuration.server));
 
});

//Delete the dist directory
gulp.task('clean', function () {
    return gulp.src('./dist', {read: false})
        .pipe(clean())
});

//Start the application
gulp.task('default', ['clean'], function(){
    gulp.start('serve');
});