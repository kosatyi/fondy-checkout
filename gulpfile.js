var gulp     = require('gulp');
var less     = require('gulp-less');
var concat   = require('gulp-concat');
var uglify   = require('gulp-uglify');
var cssmin   = require('gulp-cssmin');
var flatten  = require('gulp-flatten');
var del      = require('del');
var wrap     = require('gulp-wrap');
var htmlToJs = require('gulp-html-to-js');
var rename   = require('gulp-rename');
var gettext  = require('node-gettext-generator');
var jsmin    = require('gulp-jsmin');

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
            locales:['ru','en','uk','lv','cs','fr','sk']
        },
        javascript:{

        }
    });
});

gulp.task('translation', ['gettext'] , function(){
    return gulp.src(['locales/**/*.js'])
        .pipe(rename(function(path){ path.basename = path.dirname; }))
        .pipe(flatten())
        .pipe(jsmin())
        .pipe(gulp.dest('dist/i18n/'))
});

gulp.task('bootstrap-less', function(){
    return gulp.src(['bower_components/bootstrap/less/**']).pipe(gulp.dest('src/less/bootstrap'));
});

gulp.task('font-awesome-less', function(){
    return gulp.src(['bower_components/font-awesome/less/**']).pipe(gulp.dest('src/less/font-awesome'));
});

gulp.task('flag-icons-less', function(){
    return gulp.src(['bower_components/flag-icon-css/less/**']).pipe(gulp.dest('src/less/flag-icons'));
});

gulp.task('animate-less', function(){
    return gulp.src(['bower_components/animate.less/source/**']).pipe(gulp.dest('src/less/animate'));
});

gulp.task('less-import', [
    'bootstrap-less',
    'font-awesome-less',
    'flag-icons-less',
    'animate-less'
]);

gulp.task('less', ['less-import'], function(){
    return gulp.src(['src/less/*.less']).pipe(less())
        .pipe(gulp.dest('dist/css'))
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('icons', function(){
    return gulp.src(['bower_components/fondy-icons/dist/**']).pipe(gulp.dest('dist/icons'))
});

gulp.task('flags', function(){
    return gulp.src(['bower_components/flag-icon-css/flags/**']).pipe(gulp.dest('dist/flags'));
});

gulp.task('images', function(){
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


gulp.task('app', ['views'], function(){
    return combineFiles('checkout.js',[
        'bower_components/jquery/dist/jquery.js',
        'bower_components/bootstrap/dist/js/bootstrap.js',
        'bower_components/jquery-mask-plugin/dist/jquery.mask.js',
        'bower_components/ipsp-js-sdk/dist/checkout.js',
        'src/js/lib/bootstrap.validator.js',
        'src/js/lib/jquery.control.js',
        'src/js/lib/jquery.control.payment.js',
        'src/js/app/index.js',
        'src/js/app/router.js',
        'src/js/app/views.js'
    ],'dist/js');
});

gulp.task('watcher', function(){
    gulp.watch(['src/**/*.ejs'],['views']);
    gulp.watch(['bower_components/**/*.js', 'src/js/**/*.js'],['app']);
    gulp.watch(['src/less/*.less','src/less/source/*.less'],['less']);
    gulp.watch(['locales/**/*.po'],['translation']);
});

gulp.task('default', [
    'clean',
    'images',
    'icons',
    'flags',
    'fonts',
    'less',
    'translation',
    'app'
]);