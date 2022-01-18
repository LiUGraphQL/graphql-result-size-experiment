import { gql } from 'apollo-server';
import _ from 'lodash';

const typeDefs = gql`
    type Review {
        nr: ID
        ratings: [Int]
        rating1: Int
        rating2: Int
        rating3: Int
        rating4: Int
        reviewer: Person
    }

    type Person {
        nr: ID
        name: String
        reviews: [Review]
        knows: [Person]
    }

    # the schema allows the following query:
    type Query {
        Review(nr: ID!): Review
        Person(nr: ID!): Person
        Persons(limit: Int = 10): [Person]
    }
`;

/**
 * This file provides a small extension to the schema and resolvers defined in the experiment for 
 * testing pruposes.
 */
const resolvers = {
    Query: {
        Review(root, { nr }, { dataSources }) {
            return dataSources.loaders.reviewLoader.load(nr);
        },
        Person(root, { nr }, { dataSources }) {
            return dataSources.loaders.personLoader.load(nr);
        },
        Persons(root, { limit }, { dataSources }) {
            return dataSources.loaders.personsLoader.load(limit);
        },
    },
    Review: {
        ratings(review) {
            return [review.rating1, review.rating2, review.rating3, review.rating4];
        },
        reviewer(review, args, { dataSources }) {
            return dataSources.loaders.personLoader.load(review.person);
        },
    },
    Person: {
        reviews(person, args, { dataSources }) {
            if(_.isEmpty(person)) return null;
            return dataSources.loaders.personReviewsLoader.load(person.nr);
        },
        knows(person, args, { dataSources }) {
            if(_.isEmpty(person)) return null;
            return dataSources.loaders.personKnowsLoader.load(person.nr);
        }
    }
};

export { typeDefs, resolvers };
