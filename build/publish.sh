#!bin/shell
npm run build
mv dist ../.ocr-tmp
git checkout gh-pages
mv ../.ocr-tmp/** .
rm -r ../.ocr-tmp
git add --all
git commit -m 'auto build'
git push
git checkout -
