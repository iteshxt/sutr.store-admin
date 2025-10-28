# Stock Array Feature Implementation

## Overview

This feature allows stock quantities to be stored as an array, with each stock value corresponding to a specific size. This provides more granular inventory management.

## How It Works

### Database Schema

- **Before**: `stock: Number` (single value)
- **After**: `stock: [Number]` (array of values)

### Frontend Input

Users enter stock quantities as comma-separated values in a text field:

- **Example**: `12,14,15`
- Each value corresponds to a selected size in order
- If sizes are `S, M, L`, then:
  - S = 12 units
  - M = 14 units
  - L = 15 units

## User Interface

### New/Edit Product Form

1. **Select Sizes First**
   - Click on size buttons (S, M, L, XL, XXL) to select available sizes
   - Selected sizes appear in black

2. **Enter Stock Quantities**
   - In the "Stock Quantity" field, enter comma-separated numbers
   - The helper text shows: "Enter X values (one for each size: S, M, L)"
   - Example: For sizes `S, M, L`, enter `12,14,15`

3. **Validation**
   - The number of stock values must match the number of selected sizes
   - Error message appears if counts don't match

## Technical Implementation

### Files Modified

1. **Database Model** (`lib/models/Product.ts`)

   ```typescript
   stock: {
       type: [Number],
       default: [],
   }
   ```

2. **TypeScript Types** (`types/index.d.ts`)

   ```typescript
   stock?: number[];
   ```

3. **New Product Page** (`app/products/new/page.tsx`)
   - Added `stockInput` state for comma-separated input
   - Added `handleStockChange` function to parse input
   - Updated validation in `handleSubmit`

4. **Edit Product Page** (`app/products/[id]/edit/page.tsx`)
   - Added `stockInput` state
   - Added `handleStockChange` function
   - Added backward compatibility for old single-number stock values
   - Updated validation in `handleSubmit`

5. **API Routes**
   - `app/api/products/route.ts` (POST endpoint)
   - `app/api/products/[id]/route.ts` (PUT endpoint)
   - Added validation to ensure stock array length matches sizes array length

## Example Usage

### Creating a New Product

1. Select sizes: `S, M, L`
2. Enter stock: `10,20,15`
3. Result in database:

   ```javascript
   {
     sizes: ["S", "M", "L"],
     stock: [10, 20, 15]
   }
   ```

### Editing an Existing Product

- When loading a product, the stock array is converted to comma-separated string
- Display: `10, 20, 15`
- User can modify and save

### Backward Compatibility

If an old product has stock as a single number:

```javascript
{ sizes: ["S", "M"], stock: 30 }
```

It will be converted to:

```javascript
{ sizes: ["S", "M"], stock: [15, 15] }
```

(Distributed evenly across sizes)

## Validation Rules

1. **Stock array length must equal sizes array length**
   - ✅ Valid: sizes=["S","M"], stock=[10,20]
   - ❌ Invalid: sizes=["S","M"], stock=[10]

2. **Stock values must be valid numbers**
   - Non-numeric values are converted to 0
   - Example: `10,abc,15` becomes `[10, 0, 15]`

3. **Empty stock allowed**
   - If no stock entered, defaults to empty array `[]`

## Benefits

1. **Accurate Inventory**: Track stock per size accurately
2. **Better Analytics**: See which sizes are running low
3. **Improved Customer Experience**: Show accurate availability per size
4. **Flexible Management**: Easily restock specific sizes

## Migration Notes

- Existing products with single stock value will work with the system
- They will be auto-converted when edited
- No manual migration needed
- New products automatically use the array format

## Future Enhancements

Potential improvements:

- Visual stock indicator per size button
- Bulk stock update feature
- Low stock alerts per size
- Stock history tracking
- CSV import/export for stock levels
