-- FOOD MENU REPORT MIGRATION FOR CUSTOMER: Manikyarao Behara Garu (Kesariii)
-- Generated on: 2026-03-18

BEGIN;

-- 1. DELETE EXISTING ORDERS FOR THIS CUSTOMER
DELETE FROM order_items WHERE "orderId" IN (SELECT id FROM orders WHERE "customerId" = '28ba4780-93d8-4585-8fc9-083d29b4e48d');
DELETE FROM orders WHERE "customerId" = '28ba4780-93d8-4585-8fc9-083d29b4e48d';

-- 2. ENSURE MENU ITEMS EXIST
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('7fddce59-42f7-4b2b-81e7-f8a6bb117826', 'Hot Pongal', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('93bb503a-2d99-43fe-bd1c-d699c1827590', 'Vada', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('8cfc6013-2890-4de2-a286-5ff27dc7b751', 'Pineapple Rava Kesari', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('82cf1b09-d688-4b05-972c-f5094c8dd250', 'Dosa (Live Counter)', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2a99837d-6e67-445a-ad76-d0fa6d9d373b', 'White Chutney', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('ec249df7-1b87-4715-8c44-f24f500551c8', 'ALLAM CHUTNEY', NULL, '{"breakfast"}', 'BREAK FAST', NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'Sambar', 'సాంబార్', '{"dinner"}', 'LIQUIDS (Any Two)', 'ద్రవ పదార్థాలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0f31279c-5e37-4d48-adb7-3a92f76aee67', 'Coffee', 'కాఫీ', '{"breakfast"}', 'BREAKFAST', 'ఉదయాహారం', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'Tea', 'టీ', '{"breakfast"}', 'BREAKFAST', 'ఉదయాహారం', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9d942a51-3d4e-4d17-b37d-aa5342295f02', 'Cut Fruits', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2163fd96-d5ec-4945-8b38-b43543d397e7', 'Sandwich with Tomato Ketchup', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9d75e37b-f32f-4e02-92a1-07c3e0d863f1', 'Pineapple Juice', 'అనాసపండు రసం', '{"dinner"}', 'WELCOME DRINK (Any One)', 'స్వాగత పానీయం (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('d289e3fc-e4e4-4ed0-a107-bceb18775db6', 'Salted Boiled Rajma', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('e836222a-1ef9-450a-975e-c0c3618fd14b', 'Seethaphalam Juice', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('b689022a-0512-40d0-989a-80da965659d1', 'Watermelon Juice', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('6bceedc9-2865-4735-8f17-c75cba14dbaf', 'Aloo Cheese Balls', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('c75b591a-eee3-4591-9d36-b25395c05a1a', 'Spring Rolls', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('99f84940-9701-4084-9132-52bc9723843a', 'Mamidikaya Pappu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('cd3589d6-a569-414e-8fdb-2df85f62208c', 'Bhendi Fry + Gobi Pakodi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('d33bede3-77da-4838-98c0-c25e1de47fa5', 'Panasapottu Koora', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('04864cb9-4da5-4744-9ee9-4400739f99b0', 'Vankaya Karam Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('5f57bf37-c699-4f20-93db-4eb0f5d80799', 'Mealmaker Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('3778b714-4b73-4b0e-a611-110fa018ba47', 'Gongura Pachadi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('d8d771a3-8317-4e00-8f72-4bdb6aa6adda', 'Tomato Pachadi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('7699c203-fc23-4692-8bbd-a85e5f2691a3', 'Kandhi Podi', 'కంది పొడి', '{"dinner"}', 'POWDER (Any Two)', 'పొడి (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('03d15314-8429-45f9-a6ee-fc2dcd14f657', 'Perugu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('d1f3c292-5800-413c-962e-bdb662d92165', 'White Rice', 'తెల్ల బియ్యం', '{"dinner"}', 'COMMON ITEMS', 'సాధారణ వస్తువులు', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2bdbb864-0a85-44c2-9fe4-a6edaebc7476', 'Challa Merapakayalu, Appadalu, Vadiyalu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f5859b1f-6b85-4b86-b594-d11f7fefba2f', 'GHEE', NULL, '{"breakfast"}', 'BREKAFAST', NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9f880f3e-0cc1-4590-8b90-82330dc99527', 'Bobbatu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2b45b216-797b-4746-bf1f-6c372bf2bda5', 'Laddoo', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('63264cf3-8c39-44d7-aa21-296a723479e5', 'Carrot Halwa', 'క్యారెట్ హల్వా', '{"dinner"}', 'SWEETS (Any Two)', 'మిఠాయిలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('fdac41c0-f028-4bc9-8f01-d646b9b4fcf9', 'Rumali Roti', 'రుమాలి రొట్టి', '{"dinner"}', 'ROTI (Any One)', 'రొట్టి (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('bd65c35a-7af4-49ef-b0f6-b9fd4eb22db9', 'Paneer Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('fa475b31-33f9-478d-89ef-e38d75e46aff', 'Veg Pulao', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0e174d37-9684-4db8-8d6a-884f2b6b8dd1', 'Tamalapaaku Bhajji', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('99289dd3-240f-400f-b19b-b48d4c9d2543', 'Apricot Delight', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('230cf6be-ba9d-4305-8365-c184b120e5a8', 'Aloo Bonda', NULL, '{"snacks"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f2decde0-5005-41c5-af7f-b23597172ac9', 'Pan', 'పాన్', '{"dinner"}', 'COMMON ITEMS', 'సాధారణ వస్తువులు', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('961c4889-1fee-4354-8b36-2d6e987f2d8c', 'Onion Samosa / Masala Dal Vada', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('24f6783d-b279-43d7-8cf6-f050a311e3d8', 'Fried Mirchi', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('1d9cc259-fee1-46a6-b19c-a3e484daa71e', 'Palakova', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('8aab3a8a-1af3-450c-8c85-d1a8f8cd1c80', 'Pulka (Live)', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('8f326650-d144-4c59-b352-897da4f8f8f2', 'Palak Paneer', 'పాలక్ పనీర్', '{"dinner"}', 'NORTH INDIAN DISHES (Any Three)', 'ఉత్తర భారత వంటకాలు (ఏవైనా మూడు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0c052122-a229-4023-bd9a-07463c0ded24', 'Tomato Rasam', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2c0ef3a8-bc37-4882-b539-b28d73aa6045', 'Aratikaya Curry', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('4dc6e899-99d3-4666-bf41-a438c9684222', 'Dosavakaya', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('89bfa73b-f528-486c-9907-3150e470d6e9', 'Semiya Payasam', 'సేమియా పాయసం', '{"dinner"}', 'SWEETS (Any Two)', 'మిఠాయిలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('ce9763fe-cc34-4e13-9f52-fd20878528fb', 'Curd', 'పెరుగు', '{"dinner"}', 'COMMON ITEMS', 'సాధారణ వస్తువులు', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('fed0de75-30f2-4273-8d59-40deaa116b0b', 'Buttermilk', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('49a91c80-7401-4c9f-b7c3-be6e2d68cf04', 'Bhendi Cashew Fry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('90f4c276-a221-4a79-a4c6-257692054c77', 'Beans Kobbari Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('b6f8229f-6346-4609-bc40-ca123bf23425', 'Mirchi Bhajji', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('aa220202-513e-4ba0-9ddb-198270eb5ffd', 'Palakura Pappu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('1afb7dc3-4a52-4bd4-8c77-10bc9875d1a3', 'Gongura Chutney', 'గోంగూర చట్ని', '{"dinner"}', 'PICKLES (Any Two)', 'ఊరగాయలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('7115a0d1-d137-435a-ba6d-ae99b2db4333', 'Tomato Chutney', 'టమాటో చట్ని', '{"dinner"}', 'CHUTNEYS (Any Two)', 'చట్నీ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0e8c6bbf-0c87-421e-a53d-9e7ff45b51a1', 'Kandi Podi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0010ddfa-544c-461c-abe4-b4ee33958a8f', 'Majjiga Pulusu', 'మజ్జిగ పులుసు', '{"dinner"}', 'LIQUIDS (Any Two)', 'ద్రవ పదార్థాలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('20a395fd-72c6-47c1-ac07-0a1850cc9a54', 'Onion Raitha', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('864194bc-425f-4236-9546-f11330d4bc2e', 'Khubani Ka Halwa', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('b7810559-acb7-45e9-a029-91350d1ec79b', 'Double Ka Meetha', 'డబుల్ కా మీఠా', '{"dinner"}', 'SWEETS (Any Two)', 'మిఠాయిలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f4572c02-0e38-4ee6-bddf-942627d866b0', 'Ice Cream with Gulab Jamun', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('ef4aff12-6084-4f14-9520-1b372c95c29b', 'Live Pan', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('6997368d-717f-4323-8672-a467b2ecc373', 'Bondi Mixture', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('37db0f53-9bc5-4e81-8010-02a84102e951', 'Sweet Item', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9afa361e-93d1-4d76-9a7a-ec96808150df', 'Curd Rice', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('a69746f6-25d9-4749-b1af-598140a01e50', 'Chapati', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('cf37c039-df0e-43af-89d8-db15316133b8', 'Mixed Vegetable Curry', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('25b8124e-11f8-4e1e-866c-a97c77cc731c', 'Jeera Rice', 'జీర రైస్', '{"dinner"}', 'FLAVOUR RICE (Any One)', 'రుచి రైస్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('32ee9a5f-39af-4690-93dd-738fa7fe51ca', 'Idly', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('3b2b0aea-2015-405c-91e0-c2932cc17274', 'Set Dosa (Live)', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('aefdd494-d03b-42f2-aa8d-b062e884b095', 'Puri Live Counter with Curry', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('60798119-4692-424d-8571-1b6168f60545', 'Chutney', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('cb2ce5c1-54e1-4353-90b1-acb6f7ad23b1', 'Kaarapodi', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('cfdcc803-3643-4440-a13b-940bc2a273d7', 'Fruit Punch', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('5e1302fd-ccfa-49bc-82dc-2d737cdd8809', 'Kiwi Cooler', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2d690030-d15e-473a-846e-a042abdd9a70', 'Veg Manchuria', 'వెజ్ మంచూరియా', '{"dinner"}', 'STARTER (Any One)', 'స్టార్టర్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('e9ea774b-17a4-4c24-9e6b-137ff72601db', 'Mixed Pakoda', NULL, '{"welcome"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('90fd1951-53cc-4b2e-bf98-2e52237d0a0e', 'Sketch Counter', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('51754533-2c3f-4e8c-9154-0b042ab6a8d0', 'Photo Counter', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('a46d64b6-5e76-408f-a12f-50825a2a71fc', 'Bangle Making', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('4d9618ef-7d0b-4ac5-85a3-dbef2527aaa1', 'Temporary Tattoo', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('05965a2e-48a0-491e-b2d6-5546ced4d6b9', 'Balloon Counter', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('213f6c5a-2613-4d37-add0-82dcb4861f21', 'Chat Counter', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('5fd57594-1fd9-47b1-ad40-2e93ffd7970e', 'Pani Puri Counter', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('22aa9c10-c8b2-46d1-9459-9fd35767735e', 'Barbeque (Paneer Kabab + French Fries)', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('530c3a99-b149-4108-a571-113214c1c11e', 'Chocolate & Cheese Popcorn', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('c1dd4118-21a0-408b-9058-08a619fe639f', 'Kova Bobbatu (Live)', NULL, '{"live"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('adbb5851-1081-4727-966b-38142ae4b0de', 'Soup', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f6bb22b4-3264-4615-ae6b-de9466abef4e', 'Tomato Rice', 'టమాటో రైస్', '{"dinner"}', 'FLAVOUR RICE (Any One)', 'రుచి రైస్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('20a47774-7ae8-450b-aa35-bafea93ff7e1', 'Veg Biryani', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('71932ed6-5213-4653-8832-ffec992b1d50', 'Puri', 'పూరీ', '{"dinner"}', 'ROTI (Any One)', 'రొట్టి (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f79cc72e-f074-4a03-8186-02e6c84ddfc8', 'Butter Naan', 'బటర్ నాన్', '{"dinner"}', 'ROTI (Any One)', 'రొట్టి (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('6c230aa5-5ed6-4ba6-804b-e00bb4cd0159', 'Paneer Butter Masala', 'పనీర్ బటర్ మసాలా', '{"dinner"}', 'NORTH INDIAN DISHES (Any Three)', 'ఉత్తర భారత వంటకాలు (ఏవైనా మూడు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('4274c737-4fb4-4bce-a68e-b6029499f213', 'Bagara Baingan', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('e269250b-260e-4e23-a0aa-2f980688803f', 'Chana Masala', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('4c108fc9-5380-4398-b81b-c167ab135a0b', 'Aloo Tomato Curry', NULL, '{"dinner"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('81b20a3d-7383-46e6-a6c5-bc3af9a861eb', 'Rasam', 'రసం', '{"dinner"}', 'LIQUIDS (Any Two)', 'ద్రవ పదార్థాలు (ఏవైనా రెండు)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('ee06e790-0457-4d89-97f0-f5222dae7153', 'Tomato Bath', 'టమాటో బాత్', '{"breakfast"}', 'BREAKFAST', 'ఉదయాహారం', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('fc1102f0-2dcd-4fda-8b56-93666f543997', 'Dahi Wada', 'దహి వడ', '{"dinner"}', 'HOT (Any One)', 'హాట్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('08201a6d-6b19-4571-b2b5-4e55c8fe7b01', 'Persarattu (Live Counter)', NULL, '{"breakfast"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('eb813cbf-2649-433d-9f49-006e9713a5b1', 'Pulihora', 'పులిహోర', '{"dinner"}', 'FLAVOUR RICE (Any One)', 'రుచి రైస్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('35344bcd-3f7c-41c9-b16e-f6818325b8f9', 'Poornam Boorelu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('4b14f2a5-7df9-48e3-8e5a-4e4a11120bf1', 'Veg Pakodi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('991d75da-639b-4a22-8dda-cc7a1cf049ae', 'Tomato Pappu', 'టమాటో పప్పు', '{"dinner"}', 'DAL (Any One)', 'పప్పు (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9243fdba-84ee-4f42-ae99-34ee36dacebf', 'Cabbage Batani Kobbari Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('95f31362-31a9-48d9-8460-c5995639cfdf', 'Dondakaya Karam Curry', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('7b773346-4a12-40a6-b1de-d2041313a505', 'Mukkala Pulusu', 'ముక్కల పులుసు', '{"dinner"}', 'LIQUIDS (Any Two)', 'ద్రవ పదార్థం (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('b5fdcfc5-a4fd-4c66-b4f8-955391f98a4c', 'Mamidikaya Kobbarikaya Pachadi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('8415ae8f-42b8-40da-9987-5e73000a2f8d', 'Chintakaya Pachadi', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('a2e147e0-73ab-4026-82a4-87a2c59ea71c', 'Appadam', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f4b9462e-b608-466a-91f2-f28e2c1a911d', 'Vadiyalu', NULL, '{"lunch"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('2a0adfd3-e813-4bf5-a726-434413354c37', 'Fruit Salad', 'పండ్ల సలాడ్', '{"dinner"}', 'COMMON ITEMS', 'సాధారణ వస్తువులు', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('f3698bef-cdba-440e-8965-bbb9ed7cb40d', 'Ice Cream', 'ఐస్ క్రీమ్ (వెనిలా / బటర్ స్కాచ్ / స్ట్రాబెర్రీ)', '{"lunch"}', 'COMMON ITEMS', 'సాధారణ వస్తువులు', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('3e03a10b-b91e-4d81-a7cd-9fd91da0e7cb', '2 Types of Juices', NULL, '{"3pm-5pm"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('556efe7a-7559-4190-a481-627221b01ae9', 'Veg Cutlet', NULL, '{"3pm-5pm"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('0afd13f1-4a81-4d07-ad89-16d5a1eaf8bd', 'Cut Mirchi', 'కట్ మిర్చి', '{"lunch"}', 'HOT (Any One)', 'హాట్ (ఏదైనా ఒకటి)', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('8c255733-4c9c-4437-9e0d-ddd9b2e7c601', 'Veg Soup (No Mushroom)', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('cc5dd023-c566-4c7a-b48b-c6ab9978a978', 'Blue Lagoon Mocktail', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('d1d88b64-fd05-42ad-83dd-2a382858856e', 'Babycorn 65', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('9bbb31da-8408-4547-b7a8-f34efececfb7', 'Tandoor Item / Veg Bullets / Veg Shangrilla', NULL, '{"evening"}', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- 3. INSERT NEW ORDERS
INSERT INTO orders (id, "serialNumber", "customerId", "eventName", "eventType", "eventDate", "totalAmount", status, "remainingAmount", "advancePaid", "createdAt", "updatedAt")
VALUES ('8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 51, '28ba4780-93d8-4585-8fc9-083d29b4e48d', 'Kesariii - Day 2', 'Day 2 Event', '2026-04-11T00:00:00.000Z', 0, 'pending', 0, 0, NOW(), NOW());

-- ITEMS FOR ORDER Kesariii - Day 2
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a9b2274b-56bd-4392-bd8b-985a2930c051', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '7fddce59-42f7-4b2b-81e7-f8a6bb117826', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('b08111a0-0a25-4630-abcc-b7efa2ff9a18', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '93bb503a-2d99-43fe-bd1c-d699c1827590', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d6d2643e-b56a-4fcd-9466-88577fab9331', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '8cfc6013-2890-4de2-a286-5ff27dc7b751', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('39cde69d-6442-4dc0-87f5-519753eca5cb', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '82cf1b09-d688-4b05-972c-f5094c8dd250', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('bf9ff30f-876c-406b-9016-d0373f582c03', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '2a99837d-6e67-445a-ad76-d0fa6d9d373b', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('00040e6d-6515-4d3d-9942-02750cc90c6d', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'ec249df7-1b87-4715-8c44-f24f500551c8', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('59f6173b-616d-4668-9128-e336b34fe83b', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9dc66d97-5f44-4eab-aaa2-e3da02f70e36', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '0f31279c-5e37-4d48-adb7-3a92f76aee67', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('71d6fa63-a143-408f-8166-82a78d8e306b', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('2f1a457b-4008-4fd1-90bd-ee4506de145c', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '9d942a51-3d4e-4d17-b37d-aa5342295f02', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('5fa8db49-29b7-40aa-b569-85b55792d79d', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '2163fd96-d5ec-4945-8b38-b43543d397e7', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('fa20c262-42c0-4079-9088-1bf1973c3fd8', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '9d75e37b-f32f-4e02-92a1-07c3e0d863f1', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('fb9dd499-25e9-4ed4-8010-a99e08f3c63a', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'd289e3fc-e4e4-4ed0-a107-bceb18775db6', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('16746e6a-ec7c-4cd2-9077-f5e40f18755c', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'e836222a-1ef9-450a-975e-c0c3618fd14b', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d17c6a84-67cf-4a7a-9e48-e3d78e4628a7', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'b689022a-0512-40d0-989a-80da965659d1', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('654fa709-b404-419d-8622-de8bedf57a2c', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '6bceedc9-2865-4735-8f17-c75cba14dbaf', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('b0c14c68-6bd5-46c3-b926-e2df83763f06', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'c75b591a-eee3-4591-9d36-b25395c05a1a', 'WELCOME DRINKS & SNACKS (11:00 AM)', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('b6fe1546-647d-40b2-80c0-d0f170c2f589', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '99f84940-9701-4084-9132-52bc9723843a', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('c9ec48f8-af06-4548-8e9c-e5873e7ae1ea', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'cd3589d6-a569-414e-8fdb-2df85f62208c', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('cefc590b-ee82-42d1-88e3-05a6be55cadb', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'd33bede3-77da-4838-98c0-c25e1de47fa5', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('5ecaa59f-4579-4fe1-b9a0-5c9da1b9e9b8', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '04864cb9-4da5-4744-9ee9-4400739f99b0', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a411b2aa-5a16-4c98-b44f-6cfca8a6ed5c', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '5f57bf37-c699-4f20-93db-4eb0f5d80799', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('634a6192-ed65-4e05-b8a2-c7491852227f', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '3778b714-4b73-4b0e-a611-110fa018ba47', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('e9779a99-4533-4fcb-9a06-45dc3f6d5dc2', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'd8d771a3-8317-4e00-8f72-4bdb6aa6adda', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('edc30b60-2e2f-4868-9887-aabfe3c4bf30', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '7699c203-fc23-4692-8bbd-a85e5f2691a3', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d89349d0-f797-4588-841e-483e1c27a2f3', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('6a0d261b-f192-47f3-af2d-666a4a013329', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '03d15314-8429-45f9-a6ee-fc2dcd14f657', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('2aa93ad3-3caf-4bbf-9b9d-0481fc2af6f4', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'd1f3c292-5800-413c-962e-bdb662d92165', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('cb43be5c-f619-48cd-883f-db286dd48e51', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '2bdbb864-0a85-44c2-9fe4-a6edaebc7476', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('ec884f39-ef10-4390-8984-86f8c180f714', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'f5859b1f-6b85-4b86-b594-d11f7fefba2f', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('129feb4d-f3a5-4e57-b3ee-149c27fc2fbe', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '9f880f3e-0cc1-4590-8b90-82330dc99527', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9adcae58-c9ed-446d-9fce-7bf0bb93dbc4', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '2b45b216-797b-4746-bf1f-6c372bf2bda5', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9cf8007f-a6d9-49ae-8bac-16c99db07011', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '63264cf3-8c39-44d7-aa21-296a723479e5', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('22642af3-e184-4e2a-a0cf-84251926e1d3', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'fdac41c0-f028-4bc9-8f01-d646b9b4fcf9', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('57d9f728-0284-4aba-8d7d-d016be779483', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'bd65c35a-7af4-49ef-b0f6-b9fd4eb22db9', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('aa970d1c-b8f9-435e-beeb-7886e95d7f4b', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'fa475b31-33f9-478d-89ef-e38d75e46aff', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('be73ba99-0ef6-4a88-a16a-622db4d3dc53', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '0e174d37-9684-4db8-8d6a-884f2b6b8dd1', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7213882e-9f24-4099-88f0-8c5138f32384', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '99289dd3-240f-400f-b19b-b48d4c9d2543', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('e3917b37-3584-4109-8e2a-62c81f8807fd', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '230cf6be-ba9d-4305-8365-c184b120e5a8', 'SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9807d112-a24b-424b-8c58-068f647fdb1a', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'f2decde0-5005-41c5-af7f-b23597172ac9', 'SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('845b8a7f-e307-4fc2-a823-a3f8c0959068', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '961c4889-1fee-4354-8b36-2d6e987f2d8c', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('80a098ac-183f-413e-a1c4-1f0b3d731955', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '24f6783d-b279-43d7-8cf6-f050a311e3d8', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('83ef2bed-ee40-4f39-be65-227fa1e60a4b', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '1d9cc259-fee1-46a6-b19c-a3e484daa71e', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4f0ca8a3-3fe3-4138-a933-496820108c5d', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '0f31279c-5e37-4d48-adb7-3a92f76aee67', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('47675629-00c2-4940-b438-b79baf5fca86', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('43ad6386-2439-40de-9aa4-b7898628b875', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '8aab3a8a-1af3-450c-8c85-d1a8f8cd1c80', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('0fb58b9e-de94-4bf4-80f1-65cfdae5fe9c', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '8f326650-d144-4c59-b352-897da4f8f8f2', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('e4b2d294-b7b7-48cd-8217-41610bc1b7bf', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'd1f3c292-5800-413c-962e-bdb662d92165', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('af4dd6a8-b232-4f9d-9849-2182647d4716', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '0c052122-a229-4023-bd9a-07463c0ded24', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('aed65547-19b0-4fd6-9f29-67da78e42b49', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '2c0ef3a8-bc37-4882-b539-b28d73aa6045', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('30704e3a-593d-4b22-898d-38012e0fe961', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '4dc6e899-99d3-4666-bf41-a438c9684222', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('f7114293-a693-498a-a838-6ef24c94351a', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', '89bfa73b-f528-486c-9907-3150e470d6e9', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9e10a1b7-5df3-4257-b9b3-3177c9cd3b32', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'f2decde0-5005-41c5-af7f-b23597172ac9', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('1f449290-5db7-4fdf-a2e9-9d60bf67627d', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'ce9763fe-cc34-4e13-9f52-fd20878528fb', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d571e231-f643-4e6c-9860-22753b764be5', '8beb4e6a-e41f-40ef-bfe9-ce17554213e4', 'fed0de75-30f2-4273-8d59-40deaa116b0b', 'DINNER', 1);

INSERT INTO orders (id, "serialNumber", "customerId", "eventName", "eventType", "eventDate", "totalAmount", status, "remainingAmount", "advancePaid", "createdAt", "updatedAt")
VALUES ('5808e972-8503-4737-b278-388dffbe1d8f', 52, '28ba4780-93d8-4585-8fc9-083d29b4e48d', 'Kesariii - Day 3', 'Day 3 Event', '2026-04-12T00:00:00.000Z', 0, 'pending', 0, 0, NOW(), NOW());

-- ITEMS FOR ORDER Kesariii - Day 3
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9fd57e54-8993-406a-9a24-d7fd025d520a', '5808e972-8503-4737-b278-388dffbe1d8f', '49a91c80-7401-4c9f-b7c3-be6e2d68cf04', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('164915cb-760f-4b12-9148-a9cfeb6b5827', '5808e972-8503-4737-b278-388dffbe1d8f', '90f4c276-a221-4a79-a4c6-257692054c77', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('0c15db56-8ee2-403b-99c8-1ddb22f21383', '5808e972-8503-4737-b278-388dffbe1d8f', 'b6f8229f-6346-4609-bc40-ca123bf23425', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d607682b-c236-4dfa-b8e8-9bd27ca8cabd', '5808e972-8503-4737-b278-388dffbe1d8f', 'a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('532b050e-68ec-48cd-be81-0840ce2c450c', '5808e972-8503-4737-b278-388dffbe1d8f', 'aa220202-513e-4ba0-9ddb-198270eb5ffd', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('02dea533-6f95-44f2-b38d-eb9d3490bc72', '5808e972-8503-4737-b278-388dffbe1d8f', '1afb7dc3-4a52-4bd4-8c77-10bc9875d1a3', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a6873f4e-6f80-4416-a169-59f1521c7aa4', '5808e972-8503-4737-b278-388dffbe1d8f', '7115a0d1-d137-435a-ba6d-ae99b2db4333', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('6b9a58d7-1236-45a4-940e-901d86aa1de1', '5808e972-8503-4737-b278-388dffbe1d8f', '0e8c6bbf-0c87-421e-a53d-9e7ff45b51a1', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('fb111d7a-5174-4b50-b80a-1b7da0852edb', '5808e972-8503-4737-b278-388dffbe1d8f', '0010ddfa-544c-461c-abe4-b4ee33958a8f', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('ee7b34ce-96fc-44b7-8009-a5bf16966c15', '5808e972-8503-4737-b278-388dffbe1d8f', 'ce9763fe-cc34-4e13-9f52-fd20878528fb', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('c02361cd-a369-4559-b7a7-924ec4b09b6a', '5808e972-8503-4737-b278-388dffbe1d8f', '20a395fd-72c6-47c1-ac07-0a1850cc9a54', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('32a71e75-59bb-41e0-be3d-c4b76671b596', '5808e972-8503-4737-b278-388dffbe1d8f', '2bdbb864-0a85-44c2-9fe4-a6edaebc7476', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9cc40ee5-4dbf-470e-8cff-fa40c49411cc', '5808e972-8503-4737-b278-388dffbe1d8f', '864194bc-425f-4236-9546-f11330d4bc2e', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('38f9876b-d6be-4353-80d8-c373de18023c', '5808e972-8503-4737-b278-388dffbe1d8f', 'b7810559-acb7-45e9-a029-91350d1ec79b', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('1fd32661-c60a-46b4-bc71-ef6ec544b860', '5808e972-8503-4737-b278-388dffbe1d8f', 'f4572c02-0e38-4ee6-bddf-942627d866b0', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('1470a4c3-ffe7-49bb-b5b9-370e47b1dea1', '5808e972-8503-4737-b278-388dffbe1d8f', 'ef4aff12-6084-4f14-9520-1b372c95c29b', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('e3552abd-0f19-4993-99bd-0531540d8ea6', '5808e972-8503-4737-b278-388dffbe1d8f', '1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('8096ef60-2c33-4c9c-8995-0556f07cded0', '5808e972-8503-4737-b278-388dffbe1d8f', '0f31279c-5e37-4d48-adb7-3a92f76aee67', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('1e061cbc-391c-4ced-809c-9f32e6e0027e', '5808e972-8503-4737-b278-388dffbe1d8f', '6997368d-717f-4323-8672-a467b2ecc373', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('6eb580f2-5fda-4055-9a2b-e7b003b49400', '5808e972-8503-4737-b278-388dffbe1d8f', '37db0f53-9bc5-4e81-8010-02a84102e951', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a39d5983-4e83-48f6-9e9a-21f8e2a2ffb0', '5808e972-8503-4737-b278-388dffbe1d8f', '9afa361e-93d1-4d76-9a7a-ec96808150df', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('47a14538-0d28-49f4-8df3-244b89fdba00', '5808e972-8503-4737-b278-388dffbe1d8f', 'a69746f6-25d9-4749-b1af-598140a01e50', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('ddc41b83-a10c-42ac-86cb-425bd72d2c06', '5808e972-8503-4737-b278-388dffbe1d8f', 'fed0de75-30f2-4273-8d59-40deaa116b0b', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7883a5b5-8ade-4c21-ac1b-014fb95c6bd6', '5808e972-8503-4737-b278-388dffbe1d8f', 'cf37c039-df0e-43af-89d8-db15316133b8', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('09f2c82a-7b47-4dea-b369-e7f99373882a', '5808e972-8503-4737-b278-388dffbe1d8f', '25b8124e-11f8-4e1e-866c-a97c77cc731c', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('0700cad0-2223-4ab9-be09-2c43570b164d', '5808e972-8503-4737-b278-388dffbe1d8f', '32ee9a5f-39af-4690-93dd-738fa7fe51ca', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d7397327-dbb1-4498-83de-f04e77ccfb93', '5808e972-8503-4737-b278-388dffbe1d8f', '3b2b0aea-2015-405c-91e0-c2932cc17274', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('da7c75fc-4c0e-4c5d-a00d-d85d79152ca9', '5808e972-8503-4737-b278-388dffbe1d8f', 'aefdd494-d03b-42f2-aa8d-b062e884b095', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9bc308f1-771b-470d-8958-1f3ff23c89b6', '5808e972-8503-4737-b278-388dffbe1d8f', '60798119-4692-424d-8571-1b6168f60545', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('45bef032-5ba0-4292-b12d-c471bc59a0d4', '5808e972-8503-4737-b278-388dffbe1d8f', 'ec249df7-1b87-4715-8c44-f24f500551c8', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4366b458-a69f-431b-99d8-f040efecc418', '5808e972-8503-4737-b278-388dffbe1d8f', 'a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('56fcce7c-7a73-48e2-b8c2-d1bc3b15dcdf', '5808e972-8503-4737-b278-388dffbe1d8f', 'cb2ce5c1-54e1-4353-90b1-acb6f7ad23b1', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('5e247fc3-9241-4e61-a1a3-bb272abc3574', '5808e972-8503-4737-b278-388dffbe1d8f', 'f5859b1f-6b85-4b86-b594-d11f7fefba2f', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('db860695-cd41-44be-87dc-8cd725ab097f', '5808e972-8503-4737-b278-388dffbe1d8f', '1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9ffe693a-f430-4683-b621-8e29aced8a15', '5808e972-8503-4737-b278-388dffbe1d8f', '0f31279c-5e37-4d48-adb7-3a92f76aee67', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('c0e4025d-20a2-4cb7-b28e-170e9d205cd5', '5808e972-8503-4737-b278-388dffbe1d8f', 'cfdcc803-3643-4440-a13b-940bc2a273d7', 'WELCOME DRINKS & SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('b9718265-7a67-4067-865c-d153c1cb60e6', '5808e972-8503-4737-b278-388dffbe1d8f', '5e1302fd-ccfa-49bc-82dc-2d737cdd8809', 'WELCOME DRINKS & SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a2eb40f4-2b58-4afb-865d-f63333fcb216', '5808e972-8503-4737-b278-388dffbe1d8f', '2d690030-d15e-473a-846e-a042abdd9a70', 'WELCOME DRINKS & SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('110ff3df-66c6-443f-8d6f-34a73f49e727', '5808e972-8503-4737-b278-388dffbe1d8f', 'e9ea774b-17a4-4c24-9e6b-137ff72601db', 'WELCOME DRINKS & SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('409b4277-5f37-4d68-8e10-b22ab2444e04', '5808e972-8503-4737-b278-388dffbe1d8f', '90fd1951-53cc-4b2e-bf98-2e52237d0a0e', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d784fde4-5ed9-4de2-9a4c-4e78613c6032', '5808e972-8503-4737-b278-388dffbe1d8f', '51754533-2c3f-4e8c-9154-0b042ab6a8d0', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('aafe0ace-46f3-4c02-be4c-61247d23e75a', '5808e972-8503-4737-b278-388dffbe1d8f', 'a46d64b6-5e76-408f-a12f-50825a2a71fc', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7fd7bb79-78b6-42f5-a2f8-bf22d5939990', '5808e972-8503-4737-b278-388dffbe1d8f', '4d9618ef-7d0b-4ac5-85a3-dbef2527aaa1', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('21491fcc-25ce-488f-9ba8-0a3b4d299ae0', '5808e972-8503-4737-b278-388dffbe1d8f', '05965a2e-48a0-491e-b2d6-5546ced4d6b9', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('cffc47ed-3f84-4a7e-8132-f85f5fccf63a', '5808e972-8503-4737-b278-388dffbe1d8f', '213f6c5a-2613-4d37-add0-82dcb4861f21', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('e04c8896-b3e0-4a0c-be5d-ad09f2cf5dbe', '5808e972-8503-4737-b278-388dffbe1d8f', '5fd57594-1fd9-47b1-ad40-2e93ffd7970e', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('18cbb149-9c09-495a-9e8d-4e88c187c7cb', '5808e972-8503-4737-b278-388dffbe1d8f', '22aa9c10-c8b2-46d1-9459-9fd35767735e', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('8018a20a-94b1-4d0a-8155-a7a205aa1a05', '5808e972-8503-4737-b278-388dffbe1d8f', '530c3a99-b149-4108-a571-113214c1c11e', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('2277f6da-3d84-43ff-8f13-fe71ac3b7512', '5808e972-8503-4737-b278-388dffbe1d8f', 'c1dd4118-21a0-408b-9058-08a619fe639f', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('5c03cfe5-9b78-4f9b-805d-e36e5c6fa1e1', '5808e972-8503-4737-b278-388dffbe1d8f', '9d942a51-3d4e-4d17-b37d-aa5342295f02', 'LIVE COUNTERS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('c5718b5b-727c-4271-9617-7405a54d1e13', '5808e972-8503-4737-b278-388dffbe1d8f', 'adbb5851-1081-4727-966b-38142ae4b0de', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('f0bf292c-5ab8-4062-afff-0e5f25733ea9', '5808e972-8503-4737-b278-388dffbe1d8f', 'f6bb22b4-3264-4615-ae6b-de9466abef4e', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9d27e3ea-1d21-413b-b37d-06e76104c084', '5808e972-8503-4737-b278-388dffbe1d8f', '20a47774-7ae8-450b-aa35-bafea93ff7e1', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7445e844-bb07-4437-8539-7e010521b9bd', '5808e972-8503-4737-b278-388dffbe1d8f', '71932ed6-5213-4653-8832-ffec992b1d50', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7f908ff3-b9e7-4b6a-b10d-593f6aa221e5', '5808e972-8503-4737-b278-388dffbe1d8f', 'f79cc72e-f074-4a03-8186-02e6c84ddfc8', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('25ceea47-fdd0-466b-8ed4-8de23a7f4bfc', '5808e972-8503-4737-b278-388dffbe1d8f', 'd1f3c292-5800-413c-962e-bdb662d92165', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('d4a54b30-7fda-499c-8efd-08a15c6d9766', '5808e972-8503-4737-b278-388dffbe1d8f', '6c230aa5-5ed6-4ba6-804b-e00bb4cd0159', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('2c17a1ad-4b81-4362-bf12-9d124d9112c2', '5808e972-8503-4737-b278-388dffbe1d8f', '4274c737-4fb4-4bce-a68e-b6029499f213', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('82edf2c7-a87d-453e-a572-6a21b9879012', '5808e972-8503-4737-b278-388dffbe1d8f', 'e269250b-260e-4e23-a0aa-2f980688803f', 'LUNCH', 1);

INSERT INTO orders (id, "serialNumber", "customerId", "eventName", "eventType", "eventDate", "totalAmount", status, "remainingAmount", "advancePaid", "createdAt", "updatedAt")
VALUES ('e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 50, '28ba4780-93d8-4585-8fc9-083d29b4e48d', 'Kesariii - Day 1', 'Day 1 Event', '2026-04-10T00:00:00.000Z', 0, 'pending', 0, 0, NOW(), NOW());

-- ITEMS FOR ORDER Kesariii - Day 1
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('dad8f309-bec1-4da9-b70a-625b60d0c2f0', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'a69746f6-25d9-4749-b1af-598140a01e50', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a83cdf99-2aaf-4284-b7a2-24a2de90a828', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '4c108fc9-5380-4398-b81b-c167ab135a0b', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('8cafb020-f368-495b-8076-2eb71010ddf1', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '81b20a3d-7383-46e6-a6c5-bc3af9a861eb', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4c84e674-a84c-4d08-90b4-82449ca2e354', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'd1f3c292-5800-413c-962e-bdb662d92165', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4920c453-5c1b-4eb1-9d13-30787056ac14', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '9afa361e-93d1-4d76-9a7a-ec96808150df', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('52f295df-dee2-4d9d-8f81-620c302a3f08', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'fed0de75-30f2-4273-8d59-40deaa116b0b', 'DINNER', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('9ffed069-0dab-4fea-ac27-c74e3b9cc9fe', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '32ee9a5f-39af-4690-93dd-738fa7fe51ca', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a94c2844-0a45-48f2-b743-94a59976b352', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'ee06e790-0457-4d89-97f0-f5222dae7153', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a74482ef-0030-4364-b39c-17139cc5287e', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'fc1102f0-2dcd-4fda-8b56-93666f543997', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('16c55e9e-7914-49d2-badf-45c5e5113520', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '08201a6d-6b19-4571-b2b5-4e55c8fe7b01', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('bf8fa396-1365-4cb5-8654-1a919ef8e88b', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '2a99837d-6e67-445a-ad76-d0fa6d9d373b', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('293bc86d-bb90-40c3-908c-88e3dd42f150', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'ec249df7-1b87-4715-8c44-f24f500551c8', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('00cd5f69-85b5-4315-97e3-19d4e2f3931d', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'a58807f1-9b60-4ce4-820e-568a16fcb7ea', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('dc0b90da-c144-4ec6-9c77-cc6049f3eb7c', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'cb2ce5c1-54e1-4353-90b1-acb6f7ad23b1', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a941f370-0a18-4459-905b-d1bd51d3a834', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'f5859b1f-6b85-4b86-b594-d11f7fefba2f', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('59eaac64-a090-4bfc-90e5-7b2be5b2b28f', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '0f31279c-5e37-4d48-adb7-3a92f76aee67', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('663ae2ac-fd2d-4da5-9fa0-799bef2aa764', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '1f9e1519-f719-4e03-a044-0d3e09fdb7ad', 'BREAKFAST', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4fb94202-f2c6-4826-93f0-9e12cb777adb', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'eb813cbf-2649-433d-9f49-006e9713a5b1', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('072c56b7-2524-4481-b235-1700021c25e2', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '35344bcd-3f7c-41c9-b16e-f6818325b8f9', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('7d430219-14e2-4839-b214-cc9b9aa6d790', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '4b14f2a5-7df9-48e3-8e5a-4e4a11120bf1', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4dd6e280-cd50-4272-bcab-e43a5009bafd', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '991d75da-639b-4a22-8dda-cc7a1cf049ae', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('5da58e8c-0086-42e6-97e2-2dfcd648f79c', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '9243fdba-84ee-4f42-ae99-34ee36dacebf', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('4478f63e-1fe8-4792-90b7-e0d007f259f3', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '95f31362-31a9-48d9-8460-c5995639cfdf', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('fe818766-08da-465b-ab58-56a6d8ebed7a', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '7b773346-4a12-40a6-b1de-d2041313a505', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('3c65dcfe-41f0-4288-834f-dfc15728de8c', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'b5fdcfc5-a4fd-4c66-b4f8-955391f98a4c', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('37ef8448-25a1-4071-9568-7d615d2819e5', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '8415ae8f-42b8-40da-9987-5e73000a2f8d', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('eeb64cfa-5c87-48af-a0a6-743951b1ff7a', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'd1f3c292-5800-413c-962e-bdb662d92165', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('747ab9c8-e4f4-41dc-a1a4-88c168074b55', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'ce9763fe-cc34-4e13-9f52-fd20878528fb', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a983cec4-4bb6-46c0-919c-fdb0630911f9', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'a2e147e0-73ab-4026-82a4-87a2c59ea71c', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('830b12dd-ebd5-4c52-bddf-b55774172168', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'f4b9462e-b608-466a-91f2-f28e2c1a911d', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('24000d0a-b425-47cd-a10b-09d8adaf70e1', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'f2decde0-5005-41c5-af7f-b23597172ac9', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('48eb5a60-c673-4599-b2a6-47dafcfbca56', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '2a0adfd3-e813-4bf5-a726-434413354c37', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('62c95707-8ab9-4804-b643-f56e35bf295a', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'f3698bef-cdba-440e-8965-bbb9ed7cb40d', 'LUNCH', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('caba57f0-6591-41fe-b627-8b45cb883aa7', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '3e03a10b-b91e-4d81-a7cd-9fd91da0e7cb', '3PM-5PM SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('a003aa4d-043f-47ea-92f7-ff79ceae9faf', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '556efe7a-7559-4190-a481-627221b01ae9', '3PM-5PM SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('b7c4be6d-f19a-4d4d-866c-323914a6b56b', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '0afd13f1-4a81-4d07-ad89-16d5a1eaf8bd', '3PM-5PM SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('74c45d98-9ba1-4780-82a4-08bb8d9aca03', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '8c255733-4c9c-4437-9e0d-ddd9b2e7c601', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('66ae4319-fbd6-44d0-92e3-bd792ab1ea61', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'cc5dd023-c566-4c7a-b48b-c6ab9978a978', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('07f184df-a6db-46e4-8f53-e7d885e92c99', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', 'd1d88b64-fd05-42ad-83dd-2a382858856e', 'EVENING SNACKS', 1);
INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('fc56cd23-32bc-4461-8b04-e61fd5558f24', 'e4b9cb0c-2a0a-4baf-a5de-6c4e15315d04', '9bbb31da-8408-4547-b7a8-f34efececfb7', 'EVENING SNACKS', 1);

COMMIT;
