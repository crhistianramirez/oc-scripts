import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { Product } from 'ordercloud-javascript-sdk';

async function runTestCADSupplier() {
    const creds = config.test.SEB.CADSupplier;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Staging');
    const patch = { xp: { Currency: 'CAD' } };

    console.log("getting products...")
    const products = await helpers.listAll<Product>(sdk.Products.List);
    console.log("Got all products")

    const total = products.length;
    let progress = 0;
    const errors = {};

    console.log(`Patching ${total} products.`)

    await helpers.batchOperations(products, async function singleOperation(
        product: Product
    ): Promise<any> {
        try {
            await sdk.Products.Patch(product.ID!, patch);
            console.log(`Patched ${progress} out of ${total}`);
            progress++;
        } catch (e) {
            console.log("error")
            errors[product.ID!] = e;
        }
    })
    await helpers.log(errors)
    helpers.log(errors, 'SEB-patch-errors');
    console.log("done")
}

async function runTorqueFitness() {
    const creds = config.prod.SEB.TorqueFitness;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Production');
    const patch = { xp: { Currency: 'USD' } };

    console.log("getting products...")
    const products = await helpers.listAll<Product>(sdk.Products.List);
    console.log("Got all products")

    const total = products.length;
    let progress = 0;
    const errors = {};

    console.log(`Patching ${total} products.`)

    await helpers.batchOperations(products, async function singleOperation(
        product: Product
    ): Promise<any> {
        try {
            await sdk.Products.Patch(product.ID!, patch);
            console.log(`Patched ${progress} out of ${total}`);
            progress++;
        } catch (e) {
            console.log("error")
            errors[product.ID!] = e;
        }
    })
    await helpers.log(errors)
    helpers.log(errors, 'SEB-patch-errors');
    console.log("done")
}

async function runImpactCanopy() {
    const creds = config.prod.SEB.ImpactCanopy;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Production');
    const patch = { xp: { Currency: 'USD' } };

    console.log("getting products...")
    const products = await helpers.listAll<Product>(sdk.Products.List);
    console.log("Got all products")

    const total = products.length;
    let progress = 0;
    const errors = {};

    console.log(`Patching ${total} products.`)

    await helpers.batchOperations(products, async function singleOperation(
        product: Product
    ): Promise<any> {
        try {
            await sdk.Products.Patch(product.ID!, patch);
            console.log(`Patched ${progress} out of ${total}`);
            progress++;
        } catch (e) {
            console.log("error")
            errors[product.ID!] = e;
        }
    })
    await helpers.log(errors)
    helpers.log(errors, 'SEB-patch-errors');
    console.log("done")
}

async function runImpactCanopyCanada() {
    const creds = config.prod.SEB.ImpactCanopyCanada;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Production');
    const patch = { xp: { Currency: 'CAD' } };

    console.log("getting products...")
    const products = await helpers.listAll<Product>(sdk.Products.List);
    console.log("Got all products")

    const total = products.length;
    let progress = 0;
    const errors = {};

    console.log(`Patching ${total} products.`)

    await helpers.batchOperations(products, async function singleOperation(
        product: Product
    ): Promise<any> {
        try {
            await sdk.Products.Patch(product.ID!, patch);
            console.log(`Patched ${progress} out of ${total}`);
            progress++;
        } catch (e) {
            console.log("error")
            errors[product.ID!] = e;
        }
    })
    await helpers.log(errors)
    helpers.log(errors, 'SEB-patch-errors');
    console.log("done")
}

// invoke the proper function here, then debug in the debug panel
// TODO: Make sure that you add 'ProductAdmin' to the roles array in the helpers.ocClient function
// in order to avoid authentication errors.  Suppliers do not have full access.