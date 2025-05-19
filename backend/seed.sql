-- Seed 5 products for the given tenant and user
INSERT INTO public.products (
  tenant_id,
  name,
  description,
  price,
  product_commission,
  image_url,
  created_by
) VALUES
  ('8c7a7489-d7f7-4226-a0e6-a78e715b4904', 'Product 1', 'Description for product 1', 19.99, 10.0, 'https://example.com/images/product1.jpg', 'a0c99d05-fe5f-49f2-8a6b-e7f7160408e8'),
  ('8c7a7489-d7f7-4226-a0e6-a78e715b4904', 'Product 2', 'Description for product 2', 29.99, 15.0, 'https://example.com/images/product2.jpg', 'a0c99d05-fe5f-49f2-8a6b-e7f7160408e8'),
  ('8c7a7489-d7f7-4226-a0e6-a78e715b4904', 'Product 3', 'Description for product 3', 39.99, 20.0, 'https://example.com/images/product3.jpg', 'a0c99d05-fe5f-49f2-8a6b-e7f7160408e8'),
  ('8c7a7489-d7f7-4226-a0e6-a78e715b4904', 'Product 4', 'Description for product 4', 49.99, 12.5, 'https://example.com/images/product4.jpg', 'a0c99d05-fe5f-49f2-8a6b-e7f7160408e8'),
  ('8c7a7489-d7f7-4226-a0e6-a78e715b4904', 'Product 5', 'Description for product 5', 59.99, 18.0, 'https://example.com/images/product5.jpg', 'a0c99d05-fe5f-49f2-8a6b-e7f7160408e8'); 