var gulp    = require('gulp');
var less    = require('gulp-less');
var concat  = require('gulp-concat');
var uglify  = require('gulp-uglify');
var cssmin  = require('gulp-cssmin');
var flatten = require('gulp-flatten');
var del     = require('del');
var wrap    = require('gulp-wrap');
var htmlToJs = require('gulp-html-to-js');
var gettext = require('node-gettext-generator');


var combineFiles = function(name,deps,out){
    return gulp.src(deps).pipe(concat(name))
        .pipe(uglify())
        .pipe(gulp.dest(out));
};

gulp.task('fonts', function(){
    return gulp.src([
        'bower_components/**/fonts/*.*',
        'bower_components/roboto-fontface/fonts/Roboto/*.*'
    ]).pipe(flatten()).pipe(gulp.dest('dist/fonts'));
});

gulp.task('clean', function() {
    return del.sync([
        'dist',
        'src/less/bootstrap',
        'src/less/font-awesome'
    ]);
});

gulp.task('gettext', function(){
    return gettext.process({
        extract:{
            path  :['./src/views'],
            target:'./src/locale/templates.js'
        },
        params : {
            name: 'messages',
            keywords:['_'],
            source:['./src/views','./src/js/app','./src/locale'],
            target:'./locales',
            locales:['ru','en','uk','lv','cs','fr']
        }
    });
});

gulp.task('bootstrap-less', function(){
    return gulp.src(['bower_components/bootstrap/less/**']).pipe(gulp.dest('src/less/bootstrap'))
});

gulp.task('font-awesome-less', function(){
    return gulp.src(['bower_components/font-awesome/less/**']).pipe(gulp.dest('src/less/font-awesome'))
});

gulp.task('less', function(){
    return gulp.src(['src/less/*.less']).pipe(less())
        .pipe(gulp.dest('dist/css'))
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('less-import', ['bootstrap-less','font-awesome-less']);

gulp.task('img', function(){
    return gulp.src(['src/img/*.*']).pipe(gulp.dest('dist/img'));
});

gulp.task('views', function() {
    return gulp.src('src/views/**/*')
        .pipe(htmlToJs({
            prefix:'templates/',
            concat:'views.js',
            global:'$.ejs.views'
        }))
        .pipe(wrap('(function($){ <%= contents %> })(jQuery);'))
        .pipe(gulp.dest('src/js/app/'));
});


gulp.task('watcher', function(){
    gulp.watch(['src/**/*.js','bower_components/**/*.js','src/**/*.ejs'],['app']);
    gulp.watch(['src/**/*.less'],['less']);
});

gulp.task('app', ['views'] ,  function(){
    return combineFiles('checkout.js',[
        'bower_components/jquery/dist/jquery.js',
        //'bower_components/moment/min/moment-with-locales.js',
        'bower_components/bootstrap/dist/js/bootstrap.js',
        'bower_components/jquery-mask-plugin/dist/jquery.mask.js',
        'bower_components/ipsp-js-sdk/dist/checkout.js',
        //'bower_components/eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker.js',
        'src/js/lib/bootstrap.validator.js',
        'src/js/lib/jquery.control.js',
        'src/js/lib/jquery.control.payment.js',
        'src/js/app/views.js',
        'src/js/app/index.js',
        'src/js/app/router.js'
    ],'dist/js');
});

gulp.task('default', [
    'clean',
    'less-import',
    'fonts',
    'img',
    'app',
    'watcher'
]);