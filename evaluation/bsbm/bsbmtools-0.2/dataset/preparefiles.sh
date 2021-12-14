#/bin/bash
function prepare_file {
    # 1: DB creation is implicit in sqlite
    # 2-7: not supported in sqlite
    # 8: remove any trailing ',' in table creation following the above ops
    sed \
    -e 's/CREATE DATABASE IF NOT EXISTS `benchmark` DEFAULT CHARACTER SET utf8;//' \
    -e 's/USE `benchmark`;//' \
    -e 's/character set utf8 collate utf8_bin//' \
    -e 's/ ENGINE=InnoDB DEFAULT CHARSET=utf8//' \
    -e 's/LOCK TABLES .* WRITE;//' \
    -e 's/ALTER TABLE .* KEYS;//' \
    -e 's/UNLOCK TABLES;//' \
    -e 's/INDEX USING BTREE (.*),\{0,1\}//' \
    $1 | perl -0777 -pe 's/,\s+\)/\n\)/gm'
}

prepare_file 01ProductFeature.sql > 01ProductFeature.sqlite
prepare_file 02ProductType.sql > 02ProductType.sqlite
prepare_file 03Producer.sql > 03Producer.sqlite
prepare_file 04Product.sql > 04Product.sqlite
prepare_file 05ProductTypeProduct.sql > 05ProductTypeProduct.sqlite
prepare_file 06ProductFeatureProduct.sql > 06ProductFeatureProduct.sqlite
prepare_file 07Vendor.sql > 07Vendor.sqlite
prepare_file 08Offer.sql > 08Offer.sqlite
prepare_file 09Person.sql > 09Person.sqlite
prepare_file 10Review.sql > 10Review.sqlite
touch database.db
sqlite3 database.db < 01ProductFeature.sqlite
sqlite3 database.db < 02ProductType.sqlite
sqlite3 database.db < 03Producer.sqlite
sqlite3 database.db < 04Product.sqlite
sqlite3 database.db < 05ProductTypeProduct.sqlite
sqlite3 database.db < 06ProductFeatureProduct.sqlite
sqlite3 database.db < 07Vendor.sqlite
sqlite3 database.db < 08Offer.sqlite
sqlite3 database.db < 09Person.sqlite
sqlite3 database.db < 10Review.sqlite

sqlite3 database.db < knowsperson.sqlite
