/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require("path");
const gulp = require("gulp");
const mozjpeg = require("imagemin-mozjpeg");
const pngquant = require("imagemin-pngquant");
const imagemin = require("gulp-imagemin");
const rename = require("gulp-rename");
const gulpif = require("gulp-if");

/* eslint-disable max-len */
const assetTypes = `jpg,jpeg,png,svg,gif,webp,webm,mp4,mov,ogg,wav,mp3,txt,yaml`;
/* eslint-enable max-len */

const isProd = process.env.ELEVENTY_ENV === "prod";

// These are images that our CSS refers to.
gulp.task("copy-global-images", () => {
  return gulp.src(["./src/images/**/*"]).pipe(gulp.dest("./dist/images"));
});

// These are misc top-level assets.
gulp.task("copy-misc", () => {
  return gulp.src(["./src/misc/**/*"]).pipe(gulp.dest("./dist"));
});

// Images and any other assets in the content directory that should be copied
// over along with the posts themselves.
// Because we use permalinks to strip the parent directories form our posts
// we need to also strip them from the content paths.
gulp.task("copy-content-assets", () => {
  return (
    gulp
      .src([`./src/site/content/en/**/*.{${assetTypes}}`])
      .pipe(
        gulpif(
          isProd,
          imagemin([pngquant({quality: [0.8, 0.8]}), mozjpeg({quality: 80})]),
        ),
      )
      // This makes the images show up in the same spot as the permalinked posts
      // they belong to.
      .pipe(
        rename(function(assetPath) {
          const parts = assetPath.dirname.split("/");
          // Let the en/images directory pass through.
          if (parts[0] === "images") {
            return;
          }
          // Let en/handbook images pass through.
          if (parts[0] === "handbook") {
            return;
          }
          return (assetPath.dirname = path.basename(assetPath.dirname));
        }),
      )
      .pipe(gulp.dest("./dist/en"))
  );
});

gulp.task("copy-node_modules-assets", () => {
  return gulp
    .src([`./node_modules/@webcomponents/webcomponentsjs/bundles/*.js`])
    .pipe(gulp.dest("./dist/lib/webcomponents/bundles/"));
});

gulp.task(
  "build",
  gulp.parallel(
    "copy-global-images",
    "copy-misc",
    "copy-content-assets",
    "copy-node_modules-assets",
  ),
);

gulp.task("watch", () => {
  gulp.watch("./src/images/**/*", gulp.series("copy-global-images"));
  gulp.watch("./src/misc/**/*", gulp.series("copy-misc"));
  gulp.watch("./src/site/content/**/*", gulp.series("copy-content-assets"));
});
