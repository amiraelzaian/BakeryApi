const Groq = require("groq-sdk");
const Product = require('../models/product.model')
const { addProductToCart } = require("./cart.controller")
const { addProductToWishlist } = require('./wishlist.controller')
const { createOrder } = require('./order.controller')
const ApiError = require("../utils/apiError")

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// =========================
// INTERNAL CONTROLLER INVOKER — now catches ApiError instead of rejecting
// =========================
const invokeController = (controllerFn, fakeReq) => {
    return new Promise((resolve) => {
        const fakeRes = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this },
            json(payload) { resolve({ statusCode: this.statusCode, body: payload }) },
            send(payload) { resolve({ statusCode: this.statusCode, body: payload }) },
            locals: {},
        };

        const next = (err) => {
            if (err) {
                resolve({
                    statusCode: err.statusCode || 500,
                    body: { status: "error", message: err.message || "Something went wrong." },
                });
            }
        };

        const req = { params: {}, query: {}, ...fakeReq };  // defaults لأي حاجة الكنترولر ممكن يتوقعها

        Promise.resolve(controllerFn(req, fakeRes, next)).catch(next);
    });
};

// =========================
// TOOL DEFINITIONS — OpenAI/Groq format (lowercase JSON Schema types)
// =========================
const tools = [
    {
        type: "function",
        function: {
            name: "search_products",
            description: "Search current bakery products by keyword, category, or max price. Always use this instead of guessing — it reflects real stock and prices.",
            parameters: {
                type: "object",
                properties: {
                    keyword: { type: "string" },
                    maxPrice: { type: "number" },
                    categoryId: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_to_cart",
            description: "Add a product to the logged-in customer's cart. If the product has multiple sizes (check search_products results), you must ask the customer which size before calling this.",
            parameters: {
                type: "object",
                properties: {
                    productId: { type: "string" },
                    quantity: { type: "number" },
                    size: { type: "string", enum: ["small", "medium", "large"] },
                },
                required: ["productId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_to_wishlist",
            description: "Add a product to the logged-in customer's wishlist.",
            parameters: {
                type: "object",
                properties: { productId: { type: "string" } },
                required: ["productId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "place_order",
            description: "Create an order from whatever is currently in the customer's cart. Only call this after the customer has explicitly confirmed the items, payment method, and delivery method.",
            parameters: {
                type: "object",
                properties: {
                    paymentMethod: { type: "string", enum: ["cash", "card"] },
                    deliveryMethod: { type: "string", enum: ["delivery", "pickup"] },
                },
            },
        },
    },
];

// =========================
// EXECUTE A TOOL CALL
// =========================
const executeFunction = async (name, args, req) => {
    switch (name) {
       case "search_products": {
    const filter = { isAvailable: true };

    if (args.keyword) {
        filter.name = { $regex: args.keyword, $options: "i" }; // case-insensitive search في الداتابيز
    }

    const products = await Product.find(filter).populate('categoryId', "name").limit(20);

    const category = args.categoryId?.toLowerCase();

    const filtered = products.filter(p => {
        const matchesPrice = args.maxPrice
            ? (p.sizes?.length ? p.sizes.some(s => s.price <= args.maxPrice) : p.price <= args.maxPrice)
            : true;
        const matchesCategory = category
            ? p.categoryId?.name?.toLowerCase().includes(category)
            : true;
        return matchesPrice && matchesCategory;
    });

    return filtered.map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        sizes: p.sizes?.length ? p.sizes.map(s => ({ name: s.name, price: s.price })) : undefined,
        inStock: p.stockQuantity > 0,
        category: p.categoryId?.name,
        url: `${process.env.FRONT_URL}/explore/${p._id}`
    }))
}
case 'add_to_cart': {
    if (!req.user) return { error: "Customer must be logged in." };
    const result = await invokeController(addProductToCart, {
        user: req.user,
        params: {},
        body: { productId: args.productId, quantity: args.quantity || 1, size: args.size },
    })
    return result.body;
}

        case "add_to_wishlist": {
            if (!req.user) return { error: "Customer must be logged in." };
            const result = await invokeController(addProductToWishlist, {
                user: req.user, body: { productId: args.productId },
            });
            return result.body;
        }

        case "place_order": {
            if (!req.user) return { error: "Customer must be logged in." };
            const result = await invokeController(createOrder, {
                user: req.user,
                body: { paymentMethod: args.paymentMethod || "cash", deliveryMethod: args.deliveryMethod || "pickup" },
            });
            return result.body;
        }

        default:
            return { error: "Unknown function" };
    }
}

const SYSTEM_PROMPT = `You are the Golden Crumbs Bakery assistant.
Reply in the same language the customer used (Arabic or English).
Always use search_products to check real stock, freshness, and prices —
never guess a product exists. Always include the product's url from
search results in your answer as a clickable link.
If a product's search result includes a "sizes" array, it does NOT have
a flat price — you must ask the customer which size they want before
calling add_to_cart, and pass that size back.
If add_to_cart, add_to_wishlist, or place_order returns a status "error",
explain the problem to the customer in plain language and suggest what
they can do instead — never expose raw error objects.
Before calling place_order, summarize the cart and ask the customer to
confirm the payment method and delivery method first — never place an
order without explicit confirmation in the conversation.
If place_order returns a paymentUrl, tell the customer to complete
payment by clicking it — the order is not final until they do.`;

// =========================
// MAIN ENDPOINT
// =========================
exports.sendMessage = async (req, res, next) => {
    const { message, history = [] } = req.body;
    if (!message) {
        return next(new ApiError('message is required', 400))
    }

    let messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map(h => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
        })),
        { role: "user", content: message },
    ];

    try {
        let completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages,
            tools,
        });

        let choice = completion.choices[0];
        let safety = 0;

        while (choice.message.tool_calls?.length && safety < 6) {
            messages.push(choice.message);

            for (const toolCall of choice.message.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                console.log('args:', args)
                const result = await executeFunction(toolCall.function.name, args, req);
                console.log('result', result)
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                });
            }

            completion = await groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages,
                tools,
            });
            choice = completion.choices[0];
            safety++;
        }

        if (res.headersSent) return;
        res.status(200).json({
            status: "success",
            reply: choice.message.content || "Sorry, I couldn't generate a response to that. Could you rephrase?",
        });

    } catch (e) {
        console.log("GROQ ERROR STATUS:", e.status);
        console.log("GROQ ERROR MESSAGE:", e.message);
        if (res.headersSent) return next(e);
        if (e.status === 429 || e.status === 503) {
            return res.status(200).json({
                status: 'success',
                reply: "The assistant is busy right now, please try again in a moment 🙏"
            })
        }
        next(e)
    }
}