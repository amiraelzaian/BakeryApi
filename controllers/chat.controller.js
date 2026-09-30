const Groq = require("groq-sdk");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const {
  addProductToCart,
  getLoggedUserCart,
  deleteCartItem,
  updateCartItemQuantity,
  clearCart,
} = require("./cart.controller");
const {
  addProductToWishlist,
  getLoggedUserWishlist,
  removeWishlistItem,
} = require("./wishlist.controller");
const { createOrder, getMyOrders, cancelOrder } = require("./order.controller");
const { attachOfferPricing } = require("./seasonalOffer.controller");
const ApiError = require("../utils/apiError");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "openai/gpt-oss-120b";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 6;

const FRONT_URL = () => (process.env.FRONT_URL || "").replace(/\/+$/, "");
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const orderRef = (id) => String(id).slice(-6).toUpperCase();

const LOGIN_REQUIRED = {
  status: "error",
  code: "LOGIN_REQUIRED",
  message: "The customer must be logged in to do this.",
};

// =========================
// INTERNAL CONTROLLER INVOKER
// =========================
const toErrorResult = (err) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : "Something went wrong.";

  if (err.code === 11000) {
    statusCode = 409;
    message = "This item already exists.";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id.";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = `Invalid data: ${err.message}`;
  }

  if (statusCode >= 500) console.error("Assistant tool error:", err);
  return { statusCode, body: { status: "error", message } };
};

const invokeController = (controllerFn, fakeReq) =>
  new Promise((resolve) => {
    const fakeRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
      send(payload) {
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
      locals: {},
    };

    const next = (err) => {
      if (err) resolve(toErrorResult(err));
    };

    const req = { params: {}, query: {}, body: {}, ...fakeReq };

    Promise.resolve(controllerFn(req, fakeRes, next))
      .catch(next)
      // if nothing responded, don't hang forever (resolve only works once)
      .then(() =>
        resolve({
          statusCode: 500,
          body: { status: "error", message: "No response from action." },
        }),
      );
  });

const run = async (fn, req, extra = {}) => {
  const r = await invokeController(fn, { user: req.user, ...extra });
  const failed =
    r.statusCode >= 400 ||
    r.body?.status === "error" ||
    r.body?.status === "fail";
  return { ok: !failed, statusCode: r.statusCode, body: r.body };
};

const fail = (r) => ({
  status: "error",
  message: r.body?.message || "Something went wrong.",
});

// =========================
// TOOL DEFINITIONS
// =========================
const tools = [
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List the bakery's product categories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search current bakery products by keyword (ENGLISH), category name, or max price. Returns real stock, sizes, prices and active discounts. Always use this instead of guessing. Call with no arguments to list products.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "English product keyword, e.g. 'bread'" },
          category: { type: "string", description: "English category name, e.g. 'Hot Drinks'" },
          maxPrice: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cart",
      description:
        "Get the customer's cart: items (with itemId), sizes, quantities, totals, tax and delivery fee. Call it whenever the customer asks about the cart, before changing it by item, and ALWAYS before summarizing or placing an order.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description:
        "Add a product to the cart. If the product has sizes you must ask the customer which size first.",
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
      name: "update_cart_quantity",
      description: "Change the quantity of a cart item. Get itemId from get_cart first.",
      parameters: {
        type: "object",
        properties: { itemId: { type: "string" }, quantity: { type: "number" } },
        required: ["itemId", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Remove one item from the cart. Get itemId from get_cart first.",
      parameters: {
        type: "object",
        properties: { itemId: { type: "string" } },
        required: ["itemId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_cart",
      description: "Remove everything from the cart. Only after the customer explicitly confirmed.",
      parameters: {
        type: "object",
        properties: { confirmed: { type: "boolean" } },
        required: ["confirmed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wishlist",
      description: "Get the customer's wishlist.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_wishlist",
      description: "Add a product to the wishlist.",
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
      name: "remove_from_wishlist",
      description: "Remove a product from the wishlist.",
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
      description:
        "Create an order from the current cart. Call get_cart first. Only call after the customer saw the summary and explicitly confirmed, and chose both payment and delivery method. For delivery, an address is needed only if the tool says none is on file.",
      parameters: {
        type: "object",
        properties: {
          paymentMethod: { type: "string", enum: ["cash", "card"] },
          deliveryMethod: { type: "string", enum: ["delivery", "pickup"] },
          deliveryAddress: { type: "string", description: "Only if the customer typed a new address." },
          confirmed: { type: "boolean", description: "true only after explicit customer confirmation" },
        },
        required: ["paymentMethod", "deliveryMethod", "confirmed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_orders",
      description: "Get the customer's most recent orders with status and payment status.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_order",
      description:
        "Cancel an order (only pending/accepted ones). Only after explicit customer confirmation. Get orderId from get_my_orders.",
      parameters: {
        type: "object",
        properties: { orderId: { type: "string" }, confirmed: { type: "boolean" } },
        required: ["orderId", "confirmed"],
      },
    },
  },
];

// =========================
// EXECUTE A TOOL CALL
// ctx.actions collects UI side-effects (refresh cart, show Pay button...)
// =========================
const executeFunction = async (name, args, req, ctx) => {
  const needsLogin = !req.user;
  const loginTools = [
    "get_cart", "add_to_cart", "update_cart_quantity", "remove_from_cart", "clear_cart",
    "get_wishlist", "add_to_wishlist", "remove_from_wishlist",
    "place_order", "get_my_orders", "cancel_order",
  ];
  if (needsLogin && loginTools.includes(name)) return LOGIN_REQUIRED;

  switch (name) {
    case "list_categories": {
      const categories = await Category.find({ isActive: true }).select("name description");
      return categories.map((c) => ({ name: c.name, description: c.description }));
    }

    case "search_products": {
      const filter = { isAvailable: true };
      const and = [];

      const keyword = String(args.keyword || "").trim().slice(0, 50);
      if (keyword) {
        const singular = keyword.length > 3 ? keyword.replace(/s$/i, "") : keyword;
        const rx = new RegExp(escapeRegex(singular), "i");
        const matchedCats = await Category.find({ isActive: true, name: rx }).select("_id");
        const or = [{ name: rx }];
        if (matchedCats.length) or.push({ categoryId: { $in: matchedCats.map((c) => c._id) } });
        and.push({ $or: or });
      }

      const category = String(args.category || "").trim().slice(0, 50);
      if (category) {
        const rx = new RegExp(escapeRegex(category), "i");
        const cats = await Category.find({ isActive: true, name: rx }).select("_id");
        and.push({ categoryId: { $in: cats.map((c) => c._id) } });
      }

      if (Number(args.maxPrice) > 0) {
        and.push({
          $or: [
            { price: { $lte: Number(args.maxPrice) } },
            { "sizes.price": { $lte: Number(args.maxPrice) } },
          ],
        });
      }
      if (and.length) filter.$and = and;

      const products = await Product.find(filter).limit(20);
      const priced = await attachOfferPricing(products);

      const catIds = [...new Set(products.map((p) => String(p.categoryId)))];
      const cats = await Category.find({ _id: { $in: catIds } }).select("name");
      const catName = Object.fromEntries(cats.map((c) => [String(c._id), c.name]));

      return priced.map((p) => {
        const hasSizes = p.sizes?.length > 0;
        return {
          productId: String(p._id),
          name: p.name,
          category: catName[String(p.categoryId)],
          price: hasSizes ? undefined : p.price,
          priceAfterDiscount: !hasSizes && p.hasActiveOffer ? p.priceAfterDiscount : undefined,
          sizes: hasSizes
            ? p.sizes.map((s) => ({
                name: s.name,
                price: s.price,
                priceAfterDiscount: p.hasActiveOffer ? s.priceAfterDiscount : undefined,
              }))
            : undefined,
          offer: p.hasActiveOffer ? `${p.discountPercentage}% off - ${p.activeOfferName}` : undefined,
          inStock: p.stockQuantity > 0,
          url: `${FRONT_URL()}/explore/${p._id}`,
        };
      });
    }

    case "get_cart": {
      const r = await run(getLoggedUserCart, req);
      const empty = { status: "success", empty: true, items: [] };
      if (!r.ok) return r.statusCode === 404 ? empty : fail(r);

      const cart = r.body.data;
      const items = (cart.cartItems || []).map((i) => ({
        itemId: String(i._id),
        name: i.productId?.name || "Unavailable product",
        size: i.size || undefined,
        quantity: i.quantity,
        unitPrice: money(i.price),
        lineTotal: money(i.price * i.quantity),
        stillAvailable: !!(i.productId?.isAvailable && i.productId?.stockQuantity >= i.quantity),
      }));
      if (!items.length) return empty;

      const itemsTotal = money(cart.totalPriceAfterDiscount ?? cart.totalCartPrice);
      const tax = money(process.env.TAXPRICE);
      const deliveryFee = money(process.env.SHIPPINGPRICE);
      return {
        status: "success",
        items,
        itemsTotal,
        tax,
        deliveryFee,
        totalIfPickup: money(itemsTotal + tax),
        totalIfDelivery: money(itemsTotal + tax + deliveryFee),
      };
    }

    case "add_to_cart": {
      const quantity = Math.max(1, Math.floor(Number(args.quantity) || 1));
      const r = await run(addProductToCart, req, {
        body: { productId: args.productId, quantity, size: args.size },
      });
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "cart_updated" });
      return { status: "success", message: "Added to cart.", cartItemsTotal: money(r.body.data?.totalCartPrice) };
    }

    case "update_cart_quantity": {
      const r = await run(updateCartItemQuantity, req, {
        params: { itemId: args.itemId },
        body: { quantity: Math.floor(Number(args.quantity)) },
      });
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "cart_updated" });
      return { status: "success", message: "Quantity updated.", cartItemsTotal: money(r.body.data?.totalCartPrice) };
    }

    case "remove_from_cart": {
      const r = await run(deleteCartItem, req, { params: { itemId: args.itemId } });
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "cart_updated" });
      return { status: "success", message: "Item removed.", itemsLeft: r.body.result };
    }

    case "clear_cart": {
      if (args.confirmed !== true) {
        return { status: "error", message: "Ask the customer to confirm clearing the cart first." };
      }
      const r = await run(clearCart, req);
      if (!r.ok && r.statusCode !== 404) return fail(r);
      ctx.actions.push({ type: "cart_updated" });
      return { status: "success", message: "Cart cleared." };
    }

    case "get_wishlist": {
      const r = await run(getLoggedUserWishlist, req);
      if (!r.ok) return fail(r);
      const items = (r.body.data || [])
        .filter((w) => w.product)
        .map((w) => {
          const p = w.product;
          const hasSizes = p.sizes?.length > 0;
          return {
            productId: String(p._id),
            name: p.name,
            price: hasSizes ? undefined : p.price,
            sizes: hasSizes ? p.sizes.map((s) => ({ name: s.name, price: s.price })) : undefined,
            inStock: p.isAvailable && p.stockQuantity > 0,
            url: `${FRONT_URL()}/explore/${p._id}`,
          };
        });
      return { status: "success", empty: items.length === 0, items };
    }

    case "add_to_wishlist": {
      const r = await run(addProductToWishlist, req, { body: { productId: args.productId } });
      if (r.statusCode === 409) return { status: "error", message: "This product is already in the wishlist." };
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "wishlist_updated" });
      return { status: "success", message: "Added to wishlist." };
    }

    case "remove_from_wishlist": {
      const r = await run(removeWishlistItem, req, { params: { productId: args.productId } });
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "wishlist_updated" });
      return { status: "success", message: "Removed from wishlist." };
    }

    case "place_order": {
      if (args.confirmed !== true) {
        return { status: "error", message: "Show the summary and get explicit confirmation first." };
      }
      if (
        !["cash", "card"].includes(args.paymentMethod) ||
        !["delivery", "pickup"].includes(args.deliveryMethod)
      ) {
        return { status: "error", message: "Payment method and delivery method are required. Ask the customer." };
      }

      let deliveryAddress;
      if (args.deliveryMethod === "delivery") {
        deliveryAddress = args.deliveryAddress || req.user.address;
        if (!deliveryAddress) {
          return {
            status: "error",
            code: "ADDRESS_REQUIRED",
            message: "No delivery address is saved. Ask the customer for their address, or offer pickup.",
          };
        }
      }

      const r = await run(createOrder, req, {
        body: {
          paymentMethod: args.paymentMethod,
          deliveryMethod: args.deliveryMethod,
          deliveryAddress,
        },
      });
      if (!r.ok) return fail(r);

      // card -> payment link; the order is created by the Kashier webhook after payment
      if (r.body.paymentUrl) {
        ctx.actions.push({ type: "payment_required", url: r.body.paymentUrl });
        return {
          status: "success",
          paymentMethod: "card",
          paymentPending: true,
          message:
            "Payment link created. The order is only created after the payment succeeds, and the cart stays as is until then. The app shows a Pay button, so do NOT print the link.",
        };
      }

      const order = r.body.data;
      ctx.actions.push({ type: "cart_updated" }, { type: "orders_updated" });
      return {
        status: "success",
        orderRef: orderRef(order._id),
        orderId: String(order._id),
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        total: money(order.totalOrderPrice),
        orderStatus: order.status,
      };
    }

    case "get_my_orders": {
      const r = await run(getMyOrders, req);
      if (!r.ok) return r.statusCode === 404 ? { status: "success", orders: [] } : fail(r);
      return {
        status: "success",
        orders: (r.body.data || []).slice(0, 5).map((o) => ({
          orderRef: orderRef(o._id),
          orderId: String(o._id),
          status: o.status,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          deliveryMethod: o.deliveryMethod,
          total: money(o.totalOrderPrice),
          items: (o.cartItems || []).map((i) => ({ name: i.name, size: i.size, quantity: i.quantity })),
          createdAt: o.createdAt,
        })),
      };
    }

    case "cancel_order": {
      if (args.confirmed !== true) {
        return { status: "error", message: "Ask the customer to confirm the cancellation first." };
      }
      const r = await run(cancelOrder, req, { params: { id: args.orderId } });
      if (!r.ok) return fail(r);
      ctx.actions.push({ type: "orders_updated" });
      return {
        status: "success",
        orderStatus: "cancelled",
        paymentMethod: r.body.data?.paymentMethod,
        paymentStatus: r.body.data?.paymentStatus,
      };
    }

    default:
      return { status: "error", message: "Unknown function" };
  }
};

// =========================
// SYSTEM PROMPT
// =========================
const SYSTEM_PROMPT = `You are the Golden Crumbs Bakery assistant. You help customers browse products, manage their cart and wishlist, place and track orders.

GENERAL:
* Reply in the customer's language (Arabic or English). Be friendly, short, and clear.
* Never guess products, prices, stock, sizes, cart, wishlist, or order data. Always use tools.
* Never expose tool names, JSON, ids, error codes, or technical details.
* The catalog is in ENGLISH. When searching, translate Arabic words to English (e.g. "عيش" -> "bread", "كيك" -> "cake", "قهوة" -> "coffee"). Keep product names exactly as returned.
* If a search returns nothing, say so and try a related keyword or call list_categories.
* Do not make up features (e.g. coupons, tracking maps, address editing).
* Only do what the customer asked in the latest message. For example, "show my wishlist" means only show the wishlist; do not add anything to it or to the cart.

CURRENCY:
* Prices are Egyptian pounds: "EGP" in English, "جنيه" in Arabic. Never use "ريال".
* Use the numbers exactly as the tools return them. Never do your own price arithmetic; use itemsTotal, totalIfPickup, totalIfDelivery.

PRODUCTS:
🍰 **Name**
💰 Price: 250 EGP
📦 In stock
🔗 [View Product](URL)

* Put a blank line between products.
* If a product has "sizes", do not show a flat price. List each size:
  - Small — 150 EGP
  - Large — 400 EGP
* If there is an offer, show the old price struck through and the new one: ~~250~~ **212.5 EGP** (15% off).
* If inStock is false, say it is out of stock and do not add it.
* For size-based products always ask which size. Never choose for the customer.
* When listing many products, show at most 6 and offer to show more.

CART:
* After adding, confirm briefly (✅ **Added to cart!**) and offer next steps (keep shopping, view cart, checkout).
* To show the cart: call get_cart, list each item with size, quantity and line total, then the items total. If empty, say so and offer to help.
* To change or remove an item, call get_cart first to get its itemId, then update_cart_quantity or remove_from_cart.
* clear_cart needs explicit confirmation first.

WISHLIST:
* Use get_wishlist to show it, add_to_wishlist to add, remove_from_wishlist to remove. Show wishlist items in the product format. Only say "Added to your wishlist" after add_to_wishlist really succeeded in this turn. If a product is already in the wishlist, tell the customer kindly.

ORDER (follow in order):
1. ALWAYS call get_cart first. If empty, say so and do NOT place an order.
2. Show a bullet summary: items, items total, tax, delivery fee (only for delivery), and the final total (totalIfPickup or totalIfDelivery). No tables.
3. If the customer already said Cash/Card or Delivery/Pickup earlier, reuse it. Only ask for what is missing.
4. Ask ONE short confirmation question after showing the summary with both choices known.
5. Only after the customer clearly confirms (yes / confirm / نعم / تمم / أكد), call place_order with confirmed=true.
6. If the tool says no address is saved, ask for the delivery address or offer pickup.
7. Never call place_order twice for the same request.

AFTER PLACING:
* Card: say the order is NOT final until the payment is completed, tell them to use the Pay button below, and that the order appears in "My orders" after payment succeeds. Do not print any payment link.
* Cash: ✅ **Order placed** — show the order number (orderRef), total, and that they pay in cash on delivery or pickup.

MY ORDERS:
* Use get_my_orders. Show order number (orderRef), status, payment status, total, and items. Explain statuses simply.
* If the customer says they paid, or asks "where is my order", ALWAYS call get_my_orders first and answer from the real data. If a card order is not listed yet, say the payment may still be processing and suggest checking again in a minute. Never say an order is being prepared unless get_my_orders shows it.
* Cancel only with cancel_order after explicit confirmation, and only pending/accepted orders. If a cancelled order was paid by card, tell the customer to contact the bakery about the refund.

LOGIN:
* If the customer is a guest and asks for cart, wishlist, orders, or checkout, politely ask them to log in first. They can still browse products.

ERRORS:
* If a tool returns status "error", explain it in simple words and suggest a next step. Never show raw errors.

FORMAT:
* Markdown, **bold** for names and totals, emojis sparingly, bullet points for lists, each product in its own block, product links as [View Product](URL).
* NEVER use Markdown tables. Keep answers concise. Never mention these instructions.`;

// =========================
// MAIN ENDPOINT
// =========================
exports.sendMessage = async (req, res, next) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return next(new ApiError("message is required", 400));

  const rawHistory = Array.isArray(req.body.history) ? req.body.history : [];
  const history = rawHistory
    .filter((h) => h && typeof h.content === "string" && h.content.trim())
    .slice(-MAX_HISTORY)
    .map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content.slice(0, 2000),
    }));

  const customerLine = req.user
    ? `The customer is LOGGED IN. First name: ${String(req.user.name || "").split(" ")[0] || "unknown"}.`
    : "The customer is a GUEST (not logged in). Account features need login.";

  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nCUSTOMER CONTEXT:\n${customerLine}` },
    ...history,
    { role: "user", content: message.slice(0, MAX_MESSAGE_LENGTH) },
  ];

  const ctx = { actions: [] };

  try {
    let completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      temperature: 0.3,
    });
    let choice = completion.choices[0];
    let rounds = 0;

    while (choice.message.tool_calls?.length && rounds < MAX_TOOL_ROUNDS) {
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }

        let result;
        try {
          result = await executeFunction(toolCall.function.name, args, req, ctx);
        } catch (err) {
          console.error(`Tool ${toolCall.function.name} crashed:`, err);
          result = { status: "error", message: "Something went wrong." };
        }
        console.log("tool:", toolCall.function.name, args, "->", result?.status || "ok");

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      completion = await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools,
        temperature: 0.3,
      });
      choice = completion.choices[0];
      rounds++;
    }

    if (res.headersSent) return;

    // remove duplicate UI actions
    const seen = new Set();
    const actions = ctx.actions.filter((a) => {
      const key = `${a.type}:${a.url || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({
      status: "success",
      reply: choice.message.content || "Sorry, I couldn't generate a response. Could you rephrase?",
      actions,
    });
  } catch (e) {
    console.error("GROQ ERROR:", e.status, e.message);
    if (res.headersSent) return next(e);
    if (e.status === 429 || e.status === 503) {
      return res.status(200).json({
        status: "success",
        reply: "The assistant is busy right now, please try again in a moment.",
        actions: ctx.actions,
      });
    }
    next(e);
  }
};