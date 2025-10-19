// Reviews Loader
// Loads and parses customer reviews from the customerReviews.txt file

import reviewsFile from '../constants/customerReviews.txt?raw';

// Parse the reviews file into categories
const parseReviews = () => {
  const lines = reviewsFile.split('\n');
  const reviews = {
    5: [],
    4: [],
    3: [],
    2: [],
    1: []
  };

  let currentRating = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) return;

    // Check for category headers
    if (trimmed.startsWith('# 5 Star')) {
      currentRating = 5;
    } else if (trimmed.startsWith('# 4 Star')) {
      currentRating = 4;
    } else if (trimmed.startsWith('# 3 Star')) {
      currentRating = 3;
    } else if (trimmed.startsWith('# 2 Star')) {
      currentRating = 2;
    } else if (trimmed.startsWith('# 1 Star')) {
      currentRating = 1;
    } else if (!trimmed.startsWith('#') && currentRating !== null) {
      // Add review to current rating category
      reviews[currentRating].push(trimmed);
    }
  });

  return reviews;
};

// Cached reviews
let cachedReviews = null;

/**
 * Get all reviews organized by star rating
 */
export const getReviews = () => {
  if (!cachedReviews) {
    cachedReviews = parseReviews();
  }
  return cachedReviews;
};

/**
 * Get a random review for a specific star rating
 */
export const getRandomReview = (stars) => {
  const reviews = getReviews();
  const category = reviews[stars] || [];

  if (category.length === 0) {
    return `${stars} star review`;
  }

  return category[Math.floor(Math.random() * category.length)];
};

/**
 * Generate a review based on customer satisfaction
 * @param {boolean} qualityMet - Whether the quality met customer's expectations
 * @param {number} satisfactionScore - 0-100 satisfaction score
 * @returns {object} Review object with stars and text
 */
export const generateCustomerReview = (qualityMet, satisfactionScore) => {
  const reviews = getReviews();

  if (qualityMet) {
    // 10% chance for a 5-star review
    if (Math.random() < 0.10) {
      return {
        stars: 5,
        text: reviews[5][Math.floor(Math.random() * reviews[5].length)]
      };
    }
    // No review
    return null;
  } else {
    // 25% chance for a random 1-4 star review
    if (Math.random() < 0.25) {
      // Weight toward lower stars based on satisfaction score
      let stars;
      if (satisfactionScore < 25) {
        stars = Math.random() < 0.6 ? 1 : 2;
      } else if (satisfactionScore < 50) {
        stars = Math.random() < 0.5 ? 2 : 3;
      } else if (satisfactionScore < 75) {
        stars = Math.random() < 0.5 ? 3 : 4;
      } else {
        stars = Math.random() < 0.5 ? 3 : 4;
      }

      return {
        stars,
        text: reviews[stars][Math.floor(Math.random() * reviews[stars].length)]
      };
    }
    // No review
    return null;
  }
};
