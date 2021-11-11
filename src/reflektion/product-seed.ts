import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { Category, Order, PartialDeep } from 'ordercloud-javascript-sdk';

// Use this script to seed an OrderCloud organization with categories and products based on Reflketions product feed file.

async function seedOCOrgWithProductData() {
    // SETUP

    // Current pre-requisites to running this file (TO-DO - could eventually seed the OrderCloud part of this too).
        // Add productfeed.csv to inputData folder
        // In OrderCloud:
            // New marketplace organization
            // New admin user
            // New security profile with "FullAccess" role
            // New security profile assignment to admin user
            // New API client with admin user as default context user and client secret generated.
                // Add API Client ID and Client Secret to integration-users.config.ts (config.test.Reflektion.Admin)
            // New catalog (ID: catalog)
            // New buyer (ID: buyer) with assignment to catalog

    const productFeed = await helpers.csvToJson('productfeed.csv');

    // Create categories with Parent IDs
    await categoryBuilder(productFeed, 'catalog') // (Save productfeed.csv to inputData folder, CatalogID)

    // Assign categories to default catalog and buyer organization
    await postCategoryAssignments('catalog', 'buyer') // (CatalogID, BuyerID)

    // Creates products, along with the price schedules
    await postProducts(productFeed, 'catalog', 'https:') // (Save productfeed.csv to inputData folder, CatalogID, optional prefix for image paths)
}

async function categoryBuilder(productFeed: any[], catalogID: string) {
    const processedCategoryIDs = new Set()

    for (let row of productFeed) {
        const categoriesSplitByPipe = row.Categories.split('|');

        for (let pipeSplitCategory of categoriesSplitByPipe)
        {
            const categoryIDs = pipeSplitCategory.split('>');
            let categoryID = '';
            let parentCategoryID = '';
            for (let catID of categoryIDs) {
                const categoryNameFormatted = catID.trimStart().trimEnd();
                const categoryIDFormatted = catID
                    .replace(/\|/g, "-") // Convert pipes to hyphens,
                    .replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, '') // Remove most special characters (not hyphens/underscores)
                    .replace(/ /g,''); // Remove spaces
                categoryID += categoryID.length == 0 ? categoryIDFormatted.toLowerCase() : '-' + categoryIDFormatted.toLowerCase();
                if (processedCategoryIDs.has(categoryID)) {
                    parentCategoryID = categoryID;
                    continue;
                } else {
                    processedCategoryIDs.add(categoryID)
                    await postCategory(categoryID, categoryNameFormatted, parentCategoryID, catalogID)
                    parentCategoryID = categoryID;
                }
            }
        }
    }
}

async function postCategory(categoryID: string, categoryName: string, parentCategoryID: string, catalogID: string) {
    const categoryRequest = {
        ID: categoryID,
        Active: true,
        Name: categoryName,
        ParentID: parentCategoryID
    }
    const creds = config.test.Reflektion.Admin;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Sandbox');
    try {
        const postedCategory = await sdk.Categories.Create(catalogID, categoryRequest);
        console.log('Success', postedCategory.ID);
        return postedCategory;
    } catch (ex)
    {
        console.log('Category Error', ex)
    }
}

async function postCategoryAssignments(catalogID: string, buyerID: string) {
    const creds = config.test.Reflektion.Admin;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Sandbox');  
    const categories = await helpers.listAll<Category>(
        sdk.Categories.List,
        catalogID,
        {
            depth: 'all'
        });
    let categoryProgress = 1;
    let categoryErrors = {};
    const total = categories.length;
    await helpers.batchOperations(categories, async function singleOperation(
        category: Category
    ): Promise<any> {
        // Post category assignment
        const categoryAssignmentRequest = {
            CategoryID: category.ID,
            BuyerID: buyerID,
            Visible: true,
            ViewAllProducts: true
        };

        try {
            await sdk.Categories.SaveAssignment(catalogID, categoryAssignmentRequest);
            console.log(`Posted ${categoryProgress} out of ${total}`)
            categoryProgress++;
        } catch (ex)
        {
            console.log('Category Assignment Error', ex);
            categoryErrors[category.ID!] = ex;
            categoryProgress++;
        }
    });
    await helpers.log(categoryErrors);
    helpers.log(categoryErrors, 'reflektion-category-assignment-errors');
}

// TO-DO - Handle variants?  Riggs and Porter has parent product ID specified that we can probably run with, just couldn't find something similar in documentation.
// TO-DO - Handle facets?
// TO-DO - Handle xp values from HS product model?
async function postProducts(productFeed: any[], catalogID: string, imageUrlPrefix = '') {
    const creds = config.test.Reflektion.Admin;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Sandbox');
    let productProgress = 1;
    let productErrors = {};
    const total = productFeed.length;

    console.log(`Posting ${productFeed.length} products.`);

    await helpers.batchOperations(productFeed, async function singleOperation(
        row: any
    ): Promise<any> {
        // Post price schedule
        const priceScheduleRequest = {
            ID: row.Id,
            Name: row.Name,
            PriceBreaks: [
                { 
                    Quantity: 1,
                    Price: row.Price
                }
            ]
        }

        try {
            await sdk.PriceSchedules.Create(priceScheduleRequest);
        } catch (ex)
        {
            console.log('Price Schedule Error', ex)
        }

        // Post product
        const productRequest = {
            ID: row.Id,
            Name: row.Name,
            Active: true,
            Description: row.Description,
            DefaultPriceScheduleID: row.Id,
            xp: {
                Images: [
                    {
                        Url: imageUrlPrefix + row.ImageUrl,
                        ThumbnailUrl: imageUrlPrefix + row.Thumbnail,
                        Tags: null
                    }
                ],
                Status: 'Draft',
                IsResale: false,
                IntegrationData: null,
                HasVariants: false,
                Note: '',
                Tax: {
                    Category: 'P0000000',
                    Code: 'PC030156',
                    Description: 'Clothing And Related Products (Business-To-Business)-Work clothes (other)'
                },
                UnitOfMeasure: {
                    Qty: 1,
                    Unit: 'Per'
                },
                ProductType: 'Standard',
                SizeTier: 'D',
                Accessorials: null,
                Currency: 'USD',
                ArtworkRequired: false,
                PromotionEligible: true,
                FreeShipping: false,
                FreeShippingMessage: 'Free Shipping',
                Documents: null
            }
        }

        try {
            await sdk.Products.Create(productRequest);
            console.log(`Posted ${productProgress} out of ${total}`)
            productProgress++;
        } catch (ex)
        {
            console.log('Product Error', ex);
            productErrors[row.Id!] = ex;
            productProgress++;
        }

        // Post category-product assignment
        const categoriesSplitByPipe = row.Categories.split('|');
        for (let pipeSpiltCategory of categoriesSplitByPipe) {
            const categoryIDs = pipeSpiltCategory.split('>');
            let categoryID = '';
            for (let catID of categoryIDs) {
                const categoryIDFormatted = catID
                    .replace(/\|/g, "-") // Convert pipes to hyphens,
                    .replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, '') // Remove most special characters (not hyphens/underscores)
                    .replace(/ /g,''); // Remove spaces
                categoryID += categoryID.length == 0 ? categoryIDFormatted.toLowerCase() : '-' + categoryIDFormatted.toLowerCase();
            }
            try {
                const categoryProductAssignmentRequest = {
                    CategoryID: categoryID,
                    ProductID: row.Id
                }
                await sdk.Categories.SaveProductAssignment(catalogID, categoryProductAssignmentRequest);
            } catch (ex)
            {
                console.log('Product Category Assignment Error', ex)
            }
        }
    });

    await helpers.log(productErrors);
    helpers.log(productErrors, 'reflektion-product-post-errors');
    console.log('done');
}

// invoke the proper function here, then debug in the debug panel
seedOCOrgWithProductData()