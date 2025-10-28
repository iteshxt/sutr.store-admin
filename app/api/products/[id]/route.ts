import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import { generateSlug } from '@/lib/utils';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;

        // Validate the ID parameter
        if (!params.id || params.id === 'undefined') {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        await connectDB();
        const product = await ProductModel.findById(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Transform _id to id for frontend compatibility
        const productObj = product.toObject();
        const transformedProduct = {
            ...productObj,
            id: productObj._id.toString(),
        };

        return NextResponse.json({ success: true, product: transformedProduct });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch product', message: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const body = await request.json();
        await connectDB();

        // Validate stock array matches sizes array
        if (body.stock && Array.isArray(body.stock) && body.sizes && Array.isArray(body.sizes)) {
            if (body.stock.length !== body.sizes.length) {
                return NextResponse.json(
                    { error: `Stock array length (${body.stock.length}) must match sizes array length (${body.sizes.length})` },
                    { status: 400 }
                );
            }
        }

        // If name is being updated, regenerate slug
        if (body.name) {
            body.slug = generateSlug(body.name);
        }

        const product = await ProductModel.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Transform _id to id for frontend compatibility
        const productObj = product.toObject();
        const transformedProduct = {
            ...productObj,
            id: productObj._id.toString(),
        };

        return NextResponse.json({
            success: true,
            product: transformedProduct,
            message: 'Product updated successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to update product', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        await connectDB();
        const product = await ProductModel.findByIdAndDelete(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to delete product', message: error.message },
            { status: 500 }
        );
    }
}
