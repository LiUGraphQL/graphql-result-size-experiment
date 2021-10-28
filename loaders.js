const DataLoader = require('dataloader');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

function createLoaders() {
  return {
    reviewLoader: new DataLoader(reviewLoader),
    personLoader: new DataLoader(personLoader),
    productLoader: new DataLoader(productLoader),
    offerLoader: new DataLoader(offerLoader),
    vendorOffersLoader: new DataLoader(vendorOffersLoader),
    offerVendorLoader: new DataLoader(offerVendorLoader),
    personReviewsLoader: new DataLoader(personReviewsLoader),
    personKnowsLoader: new DataLoader(personKnowsLoader),
    productProducerLoader: new DataLoader(productProducerLoader),
    productTypeLoader: new DataLoader(productTypeLoader),
    productProductFeatureLoader: new DataLoader(productProductFeatureLoader),
    productReviewsLoader: new DataLoader(productReviewsLoader),
    productOffersLoader: new DataLoader(productOffersLoader),
    productFeatureProductsLoader: new DataLoader(productFeatureProductsLoader),
    productTypeProductsLoader: new DataLoader(productTypeProductsLoader),
    producerProductsLoader: new DataLoader(producerProductsLoader),
    db: db
  }
}

function reviewLoader(reviewIds) {
  return new Promise((resolve, reject) => {
    const reviewIdsForQuery = '(\"' + reviewIds.join("\",\"") + '\")';
    return db.all('SELECT nr, title, text, reviewDate, rating1, rating2, rating3, rating4, product, person FROM Review WHERE nr IN ' + reviewIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          review => review
        ));
      }
    });
  });
}

function personLoader(personIds) {
  return new Promise((resolve, reject) => {
    const personIdsForQuery = '(\"' + personIds.join("\",\"") + '\")';
    return db.all('SELECT nr, name, mbox_sha1sum, country FROM Person WHERE nr IN ' + personIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          person => person
        ));
      }
    });
  });
}

function productLoader(productIds) {
  return new Promise((resolve, reject) => {
    const productIdsForQuery = '(\"' + productIds.join("\",\"") + '\")';
    return db.all('SELECT nr, label, comment, producer FROM product WHERE nr IN ' + productIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          product => product
        ));
      }
    });
  });
}

function offerLoader(offerIds) {
  return new Promise((resolve, reject) => {
    const offerIdsForQuery = '(\"' + offerIds.join("\",\"") + '\")';
    return db.all('SELECT nr, price, validFrom, validTo, deliveryDays, offerWebpage, vendor, product FROM Offer WHERE nr IN ' + offerIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          offer => offer
        ));
      }
    });
  });
}

function vendorOffersLoader(vendorIds) {
  return new Promise((resolve, reject) => {
    const vendorIdsForQuery = '(\"' + vendorIds.join("\",\"") + '\")';
    return db.all('SELECT nr, price, validFrom, validTo, deliveryDays, offerWebpage, vendor, product FROM Offer WHERE vendor IN ' + vendorIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(vendorIds.map(id => {
          return rows.filter(row => row.vendor === id).map(row => row)
        }));
      }
    });
  });
}

function offerVendorLoader(vendorIds) {
  return new Promise((resolve, reject) => {
    const vendorIdsForQuery = '(\"' + vendorIds.join("\",\"") + '\")';
    return db.all('SELECT nr, label, comment, homepage, country, publisher, publishDate FROM Vendor WHERE nr IN ' + vendorIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          vendor => vendor
        ));
      }
    });
  });
}

function personReviewsLoader(personIds) {
  return new Promise((resolve, reject) => {
    const personIdsForQuery = '(\"' + personIds.join("\",\"") + '\")';
    return db.all('SELECT nr, title, text, reviewDate, rating1, rating2, rating3, rating4, product, person FROM Review WHERE person IN ' + personIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(personIds.map(id => {
          return rows.filter(row => row.person === id).map(row => row)
        }));
      }
    });
  });
}

function personKnowsLoader(personIds) {
  return new Promise((resolve, reject) => {
    const personIdsForQuery = '(\"' + personIds.join("\",\"") + '\")';
    return db.all('SELECT p.nr, p.name, p.mbox_sha1sum, p.country, kp.person FROM Person p LEFT JOIN knowsperson kp on p.nr = kp.friend WHERE kp.person IN ' + personIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(personIds.map(id => {
          return rows.filter(row => row.person === id).map(row => row)
        }));
      }
    });
  });
}

function productProducerLoader(producerIds) {
  return new Promise((resolve, reject) => {
    const producerIdsForQuery = '(\"' + producerIds.join("\",\"") + '\")';
    return db.all('SELECT nr, label, comment, homepage, country FROM Producer WHERE nr IN ' + producerIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(rows.map(
          producer => producer
        ));
      }
    });
  });
}

function productTypeLoader(productIds) {
  return new Promise((resolve, reject) => {
    const productIdsForQuery = '(\"' + productIds.join("\",\"") + '\")';
    return db.all('SELECT p.nr, p.label, p.comment, ptp.product FROM producttype p LEFT JOIN producttypeproduct ptp on p.nr = ptp.productType WHERE ptp.product IN ' + productIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productIds.map(id => {
          return rows.filter(row => row.product === id).map(row => row)
        }));
      }
    });
  });
}

function productProductFeatureLoader(product) {
  return new Promise((resolve, reject) => {
    const productIds = product;
    const productIdsForQuery = '(\"' + productIds.join("\",\"") + '\")';
    return db.all('SELECT p.nr, p.label, p.comment, pfp.product FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product IN ' + productIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productIds.map(id => {
          return rows.filter(row => row.product === id).map(row => row)
        }));
      }
    });
  });
}

function productReviewsLoader(productIds) {
  return new Promise((resolve, reject) => {
    const productIdsForQuery = '(\"' + productIds.join("\",\"") + '\")';
    return db.all('SELECT nr, title, text, reviewDate, rating1, rating2, rating3, rating4, product, person FROM Review WHERE product IN ' + productIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productIds.map(id => {
          return rows.filter(row => row.product === id).map(row => row)
        }));
      }
    });
  });
}

function productOffersLoader(productIds) {
  return new Promise((resolve, reject) => {
    const productIdsForQuery = '(\"' + productIds.join("\",\"") + '\")';
    return db.all('SELECT nr, price, validFrom, validTo, deliveryDays, offerWebpage, product, vendor FROM Offer WHERE product IN ' + productIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productIds.map(id => {
          return rows.filter(row => row.product === id).map(row => row)
        }));
      }
    });
  });
}

function productFeatureProductsLoader(productFeature) {
  return new Promise((resolve, reject) => {
    const productFeatureIds = productFeature;
    const productFeatureIdsForQuery = '(\"' + productFeatureIds.join("\",\"") + '\")';
    return db.all('SELECT p.nr, p.label, p.comment, p.producer, pfp.productfeature FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature IN ' + productFeatureIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productFeatureIds.map(id => {
          return rows.filter(row => row.productFeature === id).map(row => row);
        }));
      }
    });
  });
}

function productTypeProductsLoader(productTypeIds) {
  return new Promise((resolve, reject) => {
    const productTypeIdsForQuery = '(\"' + productTypeIds.join("\",\"") + '\")';
    return db.all('SELECT p.nr, p.label, p.comment, p.producer, ptp.producttype FROM product p LEFT JOIN producttypeproduct ptp ON p.nr = ptp.product WHERE ptp.producttype IN ' + productTypeIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(productTypeIds.map(id => {
          return rows.filter(row => row.producttype === id).map(row => row.nr)
        }));
      }
    });
  });
}

function producerProductsLoader(producerIds) {
  return new Promise((resolve, reject) => {
    const producerIdsForQuery = '(\"' + producerIds.join("\",\"") + '\")';
    return db.all('SELECT nr, label, comment, producer FROM product WHERE producer IN ' + producerIdsForQuery, (error, rows) => {
      if (error) {
        reject(error);
      }
      else {
        if (rows.length == 0) {
          return resolve([null])
        }
        return resolve(producerIds.map(id => {
          return rows.filter(row => row.producer === id).map(row => row.nr)
        }));
      }
    });
  });
}

module.exports = {
  createLoaders,
  db
};