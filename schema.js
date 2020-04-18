var {
  makeExecutableSchema
} = require('graphql-tools');

const typeDefs = `

type Vendor {
  nr: ID
  label: String
  comment: String
  homepage: String
  country: String
  publisher: Int
  publishDate: String
  offers: [Offer] @Offer(id: "nr", relation: "vendor")
}

type Offer {
  nr: ID
  price: Float
  validFrom: String
  validTo: String
  deliveryDays: Int
  offerWebpage: String
  product: Product @Offer(id: "product", relation: "nr")
  vendor: Vendor @Offer(id: "vendor", relation: "nr")
}

type Product {
  nr: ID
  label: String
  comment: String
  offers: [Offer] @Offer(id: "nr", relation: "product")
  producer: Producer @Product(id: "producer", relation: "nr")
  type: ProductType @producttypeproduct(id: "productType", relation: "product")
  productFeature(limit: Int): [ProductFeature] @Productfeatureproduct(id: "productFeature", relation: "product")
  reviews: [Review] @Review(id: "nr", relation: "product")
}

type ProductType {
  nr: ID
  label: String
  comment: String
  products: [Product] @producttypeproduct(id: "product", relation: "productType")
}

type ProductFeature {
  nr: ID
  label: String
  comment: String
  products(limit: Int): [Product] @Productfeatureproduct(id: "product", relation: "productFeature")
}

type Producer {
  nr: ID
  label: String
  comment: String
  homepage: String
  country: String
  products: [Product] @Product(id: "nr", relation: "producer")
}

type Review {
  nr: ID
  title: String
  text: String
  reviewDate: String
  rating1: Int
  rating2: Int
  rating3: Int
  rating4: Int
  reviewFor: Product @Review(id: "product", relation: "nr")
  reviewer: Person @Review(id: "person", relation: "nr")
}

type Person {
  nr: ID
  name: String
  mbox_sha1sum: String
  country: String
  reviews: [Review] @Review(id: "nr", relation: "person")
  knows: [Person] @Knowsperson(id: "friend", relation: "person")
}


  # the schema allows the following query:
  type Query {
    Review(nr: ID!): Review @Review(id: "nr", relation: "nr")
    Person(nr: ID!): Person @Person(id: "nr", relation: "nr")
    Product(nr: ID!): Product @Product(id: "nr", relation: "nr")
    Offer(nr: ID!): Offer @Offer(id: "nr", relation: "nr")
  }
`;

const resolvers = {
  Query: {
    Review(_, {nr}, context){
      return context.db.get('SELECT nr FROM Review WHERE nr = $id', {$id: nr}).then((res) => {
        return res.nr;
      })
    },
    Person(_, {nr}, context){
      return context.db.get('SELECT nr FROM Person WHERE nr = $pid', {$pid: nr}).then((res) => {
        return res.nr;
      })
    },
    Product(_, {nr}, context){
      return context.db.get('SELECT nr FROM Product WHERE nr = $pr_id', {$pr_id: nr}).then((res) => {
        return res.nr;
      })
    },
    Offer(_, {nr}, context){
      return context.db.get('SELECT nr FROM Offer WHERE nr = $id', {$id: nr}).then((res) => {
        return res.nr;
      })
    }
  },
  Vendor: {
    nr(vendor, args, context){
      return context.db.get('SELECT nr FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.nr;
      });
    },
    label(vendor, args, context){
      return context.db.get('SELECT label FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.label;
      });
    },
    comment(vendor, args, context){
      return context.db.get('SELECT comment FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.comment;
      });
    },
    homepage(vendor, args, context){
      return context.db.get('SELECT homepage FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.homepage;
      });
    },
    country(vendor, args, context){
      return context.db.get('SELECT country FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.country;
      });
    },
    publisher(vendor, args, context){
      return context.db.get('SELECT publisher FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.publisher;
      });
    },
    publishDate(vendor, args, context){
      return context.db.get('SELECT publishDate FROM Vendor WHERE nr = $id', {$id: vendor}).then((res) => {
        return res.publishDate;
      });
    },
    offers(vendor, args, context){
      return context.db.all('SELECT nr FROM Offer WHERE vendor = $id', {$id: vendor}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    }
  },
  Offer: {
    nr(offer, args, context){
      return context.db.get('SELECT nr FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.nr;
      });
    },
    price(offer, args, context){
      return context.db.get('SELECT price FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.price;
      });
    },
    validFrom(offer, args, context){
      return context.db.get('SELECT validFrom FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.validFrom;
      });
    },
    validTo(offer, args, context){
      return context.db.get('SELECT validTo FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.validTo;
      });
    },
    deliveryDays(offer, args, context){
      return context.db.get('SELECT deliveryDays FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.deliveryDays;
      });
    },
    offerWebpage(offer, args, context){
      return context.db.get('SELECT offerWebpage FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.offerWebpage;
      });
    },
    vendor(offer, args, context){
      return context.db.get('SELECT vendor FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.vendor;
      });
    },
    product(offer, args, context){
      return context.db.get('SELECT product FROM Offer WHERE nr = $id', {$id: offer}).then((res) => {
        return res.product;
      });
    }
  },
  Review: {
    nr(review, args, context) {
      return context.db.get('SELECT nr FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.nr;
      });
    },
    title(review, args, context) {
      return context.db.get('SELECT title FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.title;
      });
    },
    text(review, args, context) {
      return context.db.get('SELECT text FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.text;
      });
    },
    reviewDate(review, args, context) {
      return context.db.get('SELECT reviewDate FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.reviewDate;
      });
    },
    rating1(review, args, context) {
      return context.db.get('SELECT rating1 FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.rating1;
      });
    },
    rating2(review, args, context) {
      return context.db.get('SELECT rating2 FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.rating2;
      });
    },
    rating3(review, args, context) {
      return context.db.get('SELECT rating3 FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.rating3;
      });
    },
    rating4(review, args, context) {
      return context.db.get('SELECT rating4 FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.rating4;
      });
    },
    reviewer(review, args, context) {
      return context.db.get('SELECT person FROM Review WHERE nr = $pid', {$pid: review}).then((res) => {
        return res.person;
      });
    },
    reviewFor(review, args, context) {
      return context.db.get('SELECT product FROM Review WHERE nr = $pr_id', {$pr_id: review}).then((res) => {
        return res.product;
      });
    }
  },
  Person: {
    nr(person, args, context) {
      return context.db.get('SELECT nr FROM Person WHERE nr = $pid', {$pid: person}).then((res) => {
        return res.nr;
      });
    },
    name(person, args, context) {
      return context.db.get('SELECT name FROM Person WHERE nr = $pid', {$pid: person}).then((res) => {
        return res.name;
      });
    },
    mbox_sha1sum(person, args, context) {
      return context.db.get('SELECT mbox_sha1sum FROM Person WHERE nr = $pid', {$pid: person}).then((res) => {
        return res.mbox_sha1sum;
      });
    },
    country(person, args, context) {
      return context.db.get('SELECT country FROM Person WHERE nr = $pid', {$pid: person}).then((res) => {
        return res.country;
      });
    },
    reviews(person, args, context) {
      return context.db.all('SELECT nr FROM Review WHERE person = $pid', {$pid: person}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    },
    knows(person, args, context){
      return context.db.all('SELECT nr FROM Person p LEFT JOIN knowsperson kp on p.nr = kp.friend WHERE kp.person = $pid', {$pid: person}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    }
  },
  Product: {
    nr(product, args, context) {
      return context.db.get('SELECT nr FROM Product WHERE nr = $pr_id', {$pr_id: product}).then((res) => {
        return res.nr;
      });
    },
    label(product, args, context) {
      return context.db.get('SELECT label FROM Product WHERE nr = $pr_id', {$pr_id: product}).then((res) => {
        return res.label;
      });
    },
    comment(product, args, context) {
      return context.db.get('SELECT comment FROM Product WHERE nr = $pr_id', {$pr_id: product}).then((res) => {
        return res.comment;
      });
    },
    producer(product, args, context){
      return context.db.get('SELECT producer FROM Product WHERE nr = $pr_id', {$pr_id: product}).then((res) => {
        return res.producer;
      });
    },
    type(product, args, context){
      return context.db.get('SELECT nr FROM producttype p LEFT JOIN producttypeproduct ptp on p.nr = ptp.productType WHERE ptp.product = $pr_id', {$pr_id: product}).then((res) => {
        return res.nr;
      });
    },
    productFeature(product, {limit}, context){
      if(limit){
        return context.db.all('SELECT nr FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product = $pr_id LIMIT $limit;', {$pr_id: product, $limit: limit}).then((res) => {
          return res.map(item => {
            return item.nr;
          });
        });
      }
      else{
        return context.db.all('SELECT nr FROM productfeature p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.productfeature WHERE pfp.product = $pr_id;', {$pr_id: product}).then((res) => {
          return res.map(item => {
            return item.nr;
          });
        });
      }
    },
    reviews(product, args, context) {
      return context.db.all('SELECT nr FROM Review WHERE product = $pr_id', {$pr_id: product}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    },
    offers(product, args, context){
      return context.db.all('SELECT nr FROM Offer WHERE product = $pr_id', {$pr_id: product}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    }
  },
  ProductFeature: {
    nr(feature, args, context) {
      return context.db.get('SELECT nr FROM productfeature WHERE nr = $pr_id', {$pr_id: feature}).then((res) => {
        return res.nr;
      });
    },
    label(feature, args, context) {
      return context.db.get('SELECT label FROM productfeature WHERE nr = $pr_id', {$pr_id: feature}).then((res) => {
        return res.label;
      });
    },
    comment(feature, args, context) {
      return context.db.get('SELECT comment FROM productfeature WHERE nr = $pr_id', {$pr_id: feature}).then((res) => {
        return res.comment;
      });
    },
    products(feature, {limit}, context){
      if (limit){
        return context.db.all('SELECT nr FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature = $fid LIMIT $limit;', {$fid: feature, $limit: limit}).then((res) => {
          return res.map(item => {
            return item.nr;
          });
        });
      }
      else{
        return context.db.all('SELECT nr FROM product p LEFT JOIN productfeatureproduct pfp ON p.nr = pfp.product WHERE pfp.productfeature = $fid;', {$fid: feature}).then((res) => {
          return res.map(item => {
            return item.nr;
          });
        });
      }
    }
  },
  ProductType: {
    nr(type, args, context) {
      return context.db.get('SELECT nr FROM producttype WHERE nr = $pr_id', {$pr_id: type}).then((res) => {
        return res.nr;
      });
    },
    label(type, args, context) {
      return context.db.get('SELECT label FROM producttype WHERE nr = $pr_id', {$pr_id: type}).then((res) => {
        return res.label;
      });
    },
    comment(type, args, context) {
      return context.db.get('SELECT comment FROM producttype WHERE nr = $pr_id', {$pr_id: type}).then((res) => {
        return res.comment;
      });
    },
    products(type, args, context){
      return context.db.all('SELECT nr FROM product p LEFT JOIN producttypeproduct ptp ON p.nr = ptp.product WHERE ptp.producttype = $tid;', {$tid: type}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    }
  },
  Producer: {
    nr(producer, args, context) {
      return context.db.get('SELECT nr FROM Producer WHERE nr = $pr_id', {$pr_id: producer}).then((res) => {
        return res.nr;
      });
    },
    label(producer, args, context) {
      return context.db.get('SELECT label FROM Producer WHERE nr = $pr_id', {$pr_id: producer}).then((res) => {
        return res.label;
      });
    },    
    comment(producer, args, context) {
      return context.db.get('SELECT comment FROM Producer WHERE nr = $pr_id', {$pr_id: producer}).then((res) => {
        return res.comment;
      });
    },
    homepage(producer, args, context) {
      return context.db.get('SELECT homepage FROM Producer WHERE nr = $pr_id', {$pr_id: producer}).then((res) => {
        return res.homepage;
      });
    },
    country(producer, args, context) {
      return context.db.get('SELECT country FROM Producer WHERE nr = $pr_id', {$pr_id: producer}).then((res) => {
        return res.country;
      });
    },
    products(producer, args, context){
      return context.db.all('SELECT nr FROM product WHERE producer = $pid;', {$pid: producer}).then((res) => {
        return res.map(item => {
          return item.nr;
        });
      });
    }
  }
};

const Schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = Schema;
