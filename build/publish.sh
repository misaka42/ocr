#!bin/shell
npm run build
mv dist ../.ocr-tmp
git checkout gh-pages
cp -rf ../.ocr-tmp/** .
rm -rf ../.ocr-tmp
git add --all
git commit -m 'auto build'
git push
git checkout -
