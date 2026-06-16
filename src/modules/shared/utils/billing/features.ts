/**
 * Feature availability resolver.
 * This system ensures that new features added to the code are gracefully 
 * handled even if the database hasn't been updated with the new keys yet.
 */

const PLAN_TIERS = {
    FREE: 'Free',
    PRO: 'Pro',
    AGENCY: 'Agency'
};

// Default mapping for features when they are missing from the database JSON
const DEFAULT_FEATURE_AVAILABILITY: Record<string, string[]> = {
    hasBlog: [],
    hasGallery: [],
    hasOrders: [],
    hasCart: [],
    hasCustomDomain: [],
    hasProducts: [],
    hasPortfolio: [],
    hasTaxonomies: [],
    hasTestimonials: [],
    hasInbox: [],
    hasCustomers: [],
};

/**
 * Checks if a feature is enabled for a given plan tier and features object.
 * Logic:
 * 1. Check if the key exists in the features JSON.
 * 2. If it exists, return its value.
 * 3. If it DOES NOT exist (new feature), fallback to the default tier-based mapping.
 */
export function isFeatureEnabled(planTier: string, features: any, featureKey: string): boolean {
    const activeFeatures = features || {};
    
    // 1. Explicitly check if the property exists in the JSON
    if (Object.prototype.hasOwnProperty.call(activeFeatures, featureKey)) {
        return !!activeFeatures[featureKey];
    }

    // 2. Fallback to defaults based on plan name/tier
    const allowedTiers = DEFAULT_FEATURE_AVAILABILITY[featureKey];
    if (allowedTiers) {
        // Normalize plan tier name (case insensitive check)
        const normalizedTier = Object.values(PLAN_TIERS).find(
            t => t.toLowerCase() === planTier?.toLowerCase()
        );
        return !!normalizedTier && allowedTiers.includes(normalizedTier);
    }

    return false;
}
