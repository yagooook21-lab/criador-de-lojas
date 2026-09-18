import re

file_path = 'src/pages/StoreCheckoutPixSuccess.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The duplicate line is 'const { cartTotal, cartItems, createOrder } = useStore();'
# I'll replace two consecutive occurrences with one.

target = "const { cartTotal, cartItems, createOrder } = useStore();"
if content.count(target) >= 2:
    # Just split by it and join leaving only 1
    content = content.replace(target + "\n    " + target, target)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed StoreCheckoutPixSuccess.tsx")
else:
    print("Not found or no duplicates")
