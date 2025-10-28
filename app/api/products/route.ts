import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import { generateSlug } from '@/lib/utils';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');
        const inStock = searchParams.get('inStock');

        // Build query
        const query: any = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (featured !== null) {
            query.featured = featured === 'true';
        }
        if (inStock !== null) {
            query.inStock = inStock === 'true';
        }

        // Fetch products
        const products = await ProductModel.find(query).sort({ createdAt: -1 });

        // Transform _id to id for frontend compatibility
        const transformedProducts = products.map(product => {
            const productObj = product.toObject();
            return {
                ...productObj,
                id: productObj._id.toString(),
            };
        });

        return NextResponse.json({
            success: true,
            products: transformedProducts,
            count: transformedProducts.length
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch products', message: error.message },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { name, description, price, salePrice, category, images, sizes, colors, inStock, featured, stock, subcategory, tags, productDetails } = body;

        // Validate required fields
        if (!name || !description || !price || !category) {
            return NextResponse.json(
                { error: 'Missing required fields: name, description, price, category' },
                { status: 400 }
            );
        }

        // Validate stock array matches sizes array
        if (stock && Array.isArray(stock) && sizes && Array.isArray(sizes)) {
            if (stock.length !== sizes.length) {
                return NextResponse.json(
                    { error: `Stock array length (${stock.length}) must match sizes array length (${sizes.length})` },
                    { status: 400 }
                );
            }
        }

        // Connect to database
        await connectDB();

        // Generate slug from name
        const slug = generateSlug(name);

        // Check if slug already exists
        const existingProduct = await ProductModel.findOne({ slug });
        if (existingProduct) {
            return NextResponse.json(
                { error: 'Product with this name already exists' },
                { status: 400 }
            );
        }

        // Create product
        const product = await ProductModel.create({
            name,
            slug,
            description,
            price: parseFloat(price),
            salePrice: salePrice ? parseFloat(salePrice) : undefined,
            category,
            subcategory: subcategory || undefined,
            tags: tags || [],
            images: images || [],
            sizes: sizes || [],
            colors: colors || [],
            inStock: inStock !== false,
            featured: featured === true,
            stock: stock && Array.isArray(stock) ? stock : [],
            productDetails: productDetails || {},
        });

        // Transform _id to id for frontend compatibility
        const productObj = product.toObject();
        const transformedProduct = {
            ...productObj,
            id: productObj._id.toString(),
        };

        return NextResponse.json(
            {
                success: true,
                product: transformedProduct,
                message: 'Product created successfully'
            },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to create product', message: error.message },
            { status: 500 }
        );
    }
}
