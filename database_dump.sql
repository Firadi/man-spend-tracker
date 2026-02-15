--
-- PostgreSQL database dump
--

\restrict seeRQDAjtcpDmBvrqD9fsfA1LC9jUeAevEd0VRfEdkS2h6HG3E1Dy9UtLpOVNyt

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis (
    id integer NOT NULL,
    user_id integer NOT NULL,
    country_id text NOT NULL,
    product_id text NOT NULL,
    revenue real DEFAULT 0,
    ads real DEFAULT 0,
    service_fees real DEFAULT 0,
    product_fees real DEFAULT 0,
    delivered_orders real DEFAULT 0,
    total_orders real DEFAULT 0,
    orders_confirmed real DEFAULT 0,
    quantity_delivery real DEFAULT 0
);


--
-- Name: analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analysis_id_seq OWNED BY public.analysis.id;


--
-- Name: analysis_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_snapshots (
    id text NOT NULL,
    user_id integer NOT NULL,
    period_name text NOT NULL,
    country_id text NOT NULL,
    country_name text NOT NULL,
    currency text NOT NULL,
    snapshot_data jsonb NOT NULL,
    total_orders real DEFAULT 0 NOT NULL,
    orders_confirmed real DEFAULT 0 NOT NULL,
    delivered_orders real DEFAULT 0 NOT NULL,
    total_revenue real DEFAULT 0 NOT NULL,
    total_ads real DEFAULT 0 NOT NULL,
    total_service_fees real DEFAULT 0 NOT NULL,
    total_product_fees real DEFAULT 0 NOT NULL,
    profit real DEFAULT 0 NOT NULL,
    margin real DEFAULT 0 NOT NULL,
    created_at text NOT NULL
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id text NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    currency text NOT NULL,
    code text NOT NULL,
    default_shipping real DEFAULT 0 NOT NULL,
    default_cod real DEFAULT 0 NOT NULL,
    default_return real DEFAULT 0 NOT NULL
);


--
-- Name: daily_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_ads (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id text NOT NULL,
    date text NOT NULL,
    amount real DEFAULT 0 NOT NULL
);


--
-- Name: daily_ads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_ads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_ads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_ads_id_seq OWNED BY public.daily_ads.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    user_id integer NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    cost real DEFAULT 0 NOT NULL,
    price real DEFAULT 0 NOT NULL,
    image text,
    country_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    creatives jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at text
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: simulations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.simulations (
    id text NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    date text NOT NULL,
    inputs jsonb NOT NULL,
    results jsonb NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    email text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analysis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis ALTER COLUMN id SET DEFAULT nextval('public.analysis_id_seq'::regclass);


--
-- Name: daily_ads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ads ALTER COLUMN id SET DEFAULT nextval('public.daily_ads_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: analysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analysis (id, user_id, country_id, product_id, revenue, ads, service_fees, product_fees, delivered_orders, total_orders, orders_confirmed, quantity_delivery) FROM stdin;
6	1	538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0	ae0540e1-7faa-4c50-86f5-ca75681c0932	190	0	72	0	8	21	14	0
1	1	252d2f98-0c3d-47dc-a995-68da9599b842	898306cb-a718-4df8-84b9-4b6ac995c790	0	0	0	0	0	700	90	0
5	1	252d2f98-0c3d-47dc-a995-68da9599b842	8b7b70ab-c232-4307-8fcd-ef62ab613608	0	0	0	0	0	0	0	0
4	1	252d2f98-0c3d-47dc-a995-68da9599b842	9c4290f7-e94e-4c3f-822d-9c73189b4463	0	0	0	0	0	0	0	0
18	2	8db13ab7-c590-40a6-9f3f-321cf26b1fb1	edb80fd5-4d19-4140-92a5-7d46061f56c3	400	20	60	0	20	200	20	34
10	1	252d2f98-0c3d-47dc-a995-68da9599b842	2d66a126-e8e7-4270-a7ed-67c679eb3d84	394	0	151	23	0	0	0	0
8	1	538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0	832f414c-963d-4cef-94bf-16d57d464fca	145	0	0	0	5	22	14	0
12	2	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	2186f867-10b8-4b97-9174-aa9e17d43e99	0	35	7	1	1	1	0	1
13	2	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	f96c41c1-2a5a-43eb-834d-a1d5fc54cff6	0	0	0	0	0	0	0	0
9	1	538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	0	0	0	0	0	26	14	0
14	2	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	f4dba19e-b9c5-4fdd-ab83-8824e444cc63	0	0	0	0	0	0	0	0
16	2	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	edb80fd5-4d19-4140-92a5-7d46061f56c3	0	0	0	0	0	0	0	0
15	2	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	3441c2e5-39c9-4107-b2b5-3c9f9f67dcfc	0	0	0	0	0	0	0	0
17	2	8db13ab7-c590-40a6-9f3f-321cf26b1fb1	f4dba19e-b9c5-4fdd-ab83-8824e444cc63	500	40	120	80	50	100	50	42
11	1	252d2f98-0c3d-47dc-a995-68da9599b842	167705f9-f25e-4222-a8c2-828ec1e1badd	1401	640	439.2	94.9	61	556	255	0
7	1	538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0	c0338945-830b-497d-96fc-d995561f8201	778	87.5	279	0	31	70	45	0
2	1	252d2f98-0c3d-47dc-a995-68da9599b842	20720802-10e7-4338-9faa-4e9fd8e59bac	204	1000	65	37	9	50	39	0
3	1	252d2f98-0c3d-47dc-a995-68da9599b842	471c906c-4a47-49f0-8554-591a11d0725c	0	0	0	0	0	0	0	0
\.


--
-- Data for Name: analysis_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analysis_snapshots (id, user_id, period_name, country_id, country_name, currency, snapshot_data, total_orders, orders_confirmed, delivered_orders, total_revenue, total_ads, total_service_fees, total_product_fees, profit, margin, created_at) FROM stdin;
17312780-c303-4131-8b72-22a27044c08f	2	week 02-02 / 02-08	15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	Kenya	USD	[{"ads": 35, "margin": 0, "profit": -43, "revenue": 0, "productId": "2186f867-10b8-4b97-9174-aa9e17d43e99", "productSku": "6942CB5BA3771", "productFees": 1, "productName": "Natural essential oil soaps", "serviceFees": 7, "totalOrders": 1, "deliveryRate": 0, "deliveredOrders": 1, "ordersConfirmed": 0, "confirmationRate": 0, "quantityDelivery": 1, "deliveryRatePerLead": 100}, {"ads": 0, "margin": 0, "profit": 0, "revenue": 0, "productId": "f96c41c1-2a5a-43eb-834d-a1d5fc54cff6", "productSku": "6942CB81EA89D", "productFees": 0, "productName": "genger oiel", "serviceFees": 0, "totalOrders": 0, "deliveryRate": 0, "deliveredOrders": 0, "ordersConfirmed": 0, "confirmationRate": 0, "quantityDelivery": 0, "deliveryRatePerLead": 0}, {"ads": 0, "margin": 0, "profit": 0, "revenue": 0, "productId": "3441c2e5-39c9-4107-b2b5-3c9f9f67dcfc", "productSku": "69457A27C3551", "productFees": 0, "productName": "titan gel 1", "serviceFees": 0, "totalOrders": 0, "deliveryRate": 0, "deliveredOrders": 0, "ordersConfirmed": 0, "confirmationRate": 0, "quantityDelivery": 0, "deliveryRatePerLead": 0}, {"ads": 0, "margin": 0, "profit": 0, "revenue": 0, "productId": "f4dba19e-b9c5-4fdd-ab83-8824e444cc63", "productSku": "6946A4D6CA6E7", "productFees": 0, "productName": "retinol cream 1", "serviceFees": 0, "totalOrders": 0, "deliveryRate": 0, "deliveredOrders": 0, "ordersConfirmed": 0, "confirmationRate": 0, "quantityDelivery": 0, "deliveryRatePerLead": 0}, {"ads": 0, "margin": 0, "profit": 0, "revenue": 0, "productId": "edb80fd5-4d19-4140-92a5-7d46061f56c3", "productSku": "694578DF53EA7", "productFees": 0, "productName": "Shilajit Gummies", "serviceFees": 0, "totalOrders": 0, "deliveryRate": 0, "deliveredOrders": 0, "ordersConfirmed": 0, "confirmationRate": 0, "quantityDelivery": 0, "deliveryRatePerLead": 0}]	1	0	1	0	35	7	1	-43	0	2026-02-08T03:38:56.161Z
ff90c688-001a-445b-bfeb-f121f4685e22	2	02/02 TO 08/02	8db13ab7-c590-40a6-9f3f-321cf26b1fb1	libya	USD	[{"ads": 30, "margin": 70, "profit": 350, "revenue": 500, "productId": "f4dba19e-b9c5-4fdd-ab83-8824e444cc63", "productSku": "6946A4D6CA6E7", "productFees": 0, "productName": "retinol cream 1", "serviceFees": 120, "totalOrders": 100, "deliveryRate": 80, "deliveredOrders": 40, "ordersConfirmed": 50, "confirmationRate": 50, "quantityDelivery": 42, "deliveryRatePerLead": 40}, {"ads": 20, "margin": 72.5, "profit": 290, "revenue": 400, "productId": "edb80fd5-4d19-4140-92a5-7d46061f56c3", "productSku": "694578DF53EA7", "productFees": 0, "productName": "Shilajit Gummies", "serviceFees": 90, "totalOrders": 100, "deliveryRate": 150, "deliveredOrders": 30, "ordersConfirmed": 20, "confirmationRate": 20, "quantityDelivery": 34, "deliveryRatePerLead": 30}]	200	70	70	900	50	210	0	640	71.111115	2026-02-08T04:10:53.545Z
2f515742-03d3-409f-879e-0e35febe0d25	2	09-02/08	8db13ab7-c590-40a6-9f3f-321cf26b1fb1	libya	USD	[{"ads": 40, "margin": 52, "profit": 260, "revenue": 500, "productId": "f4dba19e-b9c5-4fdd-ab83-8824e444cc63", "productSku": "6946A4D6CA6E7", "productFees": 80, "productName": "retinol cream 1", "serviceFees": 120, "totalOrders": 100, "deliveryRate": 100, "deliveredOrders": 50, "ordersConfirmed": 50, "confirmationRate": 50, "quantityDelivery": 42, "deliveryRatePerLead": 50}, {"ads": 20, "margin": 80, "profit": 320, "revenue": 400, "productId": "edb80fd5-4d19-4140-92a5-7d46061f56c3", "productSku": "694578DF53EA7", "productFees": 0, "productName": "Shilajit Gummies", "serviceFees": 60, "totalOrders": 200, "deliveryRate": 100, "deliveredOrders": 20, "ordersConfirmed": 20, "confirmationRate": 10, "quantityDelivery": 34, "deliveryRatePerLead": 10}]	300	70	70	900	60	180	80	580	64.44444	2026-02-08T04:59:23.466Z
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, user_id, name, currency, code, default_shipping, default_cod, default_return) FROM stdin;
538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0	1	Côte d'Ivoire	USD	CI	9	0	0
15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae	2	Kenya	USD	KE	7	0	0
252d2f98-0c3d-47dc-a995-68da9599b842	1	LIBYA	USD	LY	7.2	0	0
8db13ab7-c590-40a6-9f3f-321cf26b1fb1	2	libya	USD	LY	3	0	0
\.


--
-- Data for Name: daily_ads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_ads (id, user_id, product_id, date, amount) FROM stdin;
1	1	471c906c-4a47-49f0-8554-591a11d0725c	2026-02-01	12
37	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-04	7
38	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-05	7
39	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-06	7
40	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-07	7
41	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-08	7
17	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-05	5
18	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-06	5
25	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-06	4.7
26	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-07	4.7
27	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-08	4.7
21	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-02	4.7
22	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-03	4.7
23	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-04	4.7
24	1	ae0540e1-7faa-4c50-86f5-ca75681c0932	2026-02-05	4.7
6	1	9c4290f7-e94e-4c3f-822d-9c73189b4463	2026-02-07	0
49	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-02	104
50	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-03	104
51	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-04	104
52	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-05	104
30	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-04	6
31	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-05	6
53	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-06	104
54	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-07	100
55	1	167705f9-f25e-4222-a8c2-828ec1e1badd	2026-02-08	20
42	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-02	5
43	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-03	5
44	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-04	5
45	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-05	5
46	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-06	5
47	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-07	5
32	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-06	6
19	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-07	5
20	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-08	6
14	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-02	5
15	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-03	5
16	1	832f414c-963d-4cef-94bf-16d57d464fca	2026-02-04	5
8	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-03	12.5
9	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-04	12.5
10	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-05	12.5
11	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-06	12.5
12	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-07	12.5
13	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-08	12.5
7	1	c0338945-830b-497d-96fc-d995561f8201	2026-02-02	12.5
2	1	471c906c-4a47-49f0-8554-591a11d0725c	2026-02-02	0
3	1	471c906c-4a47-49f0-8554-591a11d0725c	2026-02-03	0
48	2	2186f867-10b8-4b97-9174-aa9e17d43e99	2026-02-08	5
57	2	f96c41c1-2a5a-43eb-834d-a1d5fc54cff6	2026-02-08	30
56	2	f96c41c1-2a5a-43eb-834d-a1d5fc54cff6	2026-02-06	50
58	2	3441c2e5-39c9-4107-b2b5-3c9f9f67dcfc	2026-02-05	34
59	2	f4dba19e-b9c5-4fdd-ab83-8824e444cc63	2026-02-06	50
60	2	f4dba19e-b9c5-4fdd-ab83-8824e444cc63	2026-02-07	60
4	1	471c906c-4a47-49f0-8554-591a11d0725c	2026-02-04	0
5	1	471c906c-4a47-49f0-8554-591a11d0725c	2026-02-06	0
33	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-07	6
34	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-08	7
28	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-02	6
29	1	6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	2026-02-03	6
35	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-02	7
36	1	2d66a126-e8e7-4270-a7ed-67c679eb3d84	2026-02-03	7
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, user_id, sku, name, status, cost, price, image, country_ids, creatives, created_at) FROM stdin;
2186f867-10b8-4b97-9174-aa9e17d43e99	2	6942CB5BA3771	Natural essential oil soaps	Active	1	0	/objects/uploads/160231f0-0e60-449e-b492-5fbf88e83dfa.mp4	["15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae"]	["/objects/uploads/160231f0-0e60-449e-b492-5fbf88e83dfa.mp4", "/objects/uploads/9c70db0a-032d-4752-a852-f8023685f5fc.mp4", "/objects/uploads/a4a3ab30-0522-4674-8955-572b515d02e7.mp4", "/objects/uploads/10ea6d77-3b65-48bc-8366-4668752f76b5.mp4", "/objects/uploads/600e3c5a-025d-4464-abca-988f897dcd77.mp4", "/objects/uploads/cfc3a53a-fcca-46d1-92bb-bda05754ffea.mp4"]	\N
d5993583-a778-45a9-88b1-e13acea0746e	2	691F37559604C	سماعة طبية الاذن xb-101	Active	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2de7d5ae-fa40-4d65-979d-42172afde4c2	2	66DB085A2BB2D	جهاز تتبع	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
901132a3-8c9c-41f8-a07d-faa22c6606c0	2	666838F668371	شنطة العدة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
714446c7-ae21-4151-ac0b-95a4d7e01147	2	670560325D187	الاصقات المزيلة للسموم للتخلص من التعب و الاعياء و تحسين النوم SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e7021de5-dd6d-405b-a8f0-fb7d681a8029	2	66E834E61FE4C	مكينة الحلاقة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
6359e04c-a716-4582-a96f-48064ee782b2	2	670561FD0FEDF	اطقم اصلاح خدوش السيارة SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
897bb9ed-376c-424d-bc58-e481a764e434	2	690A4B5AD307E	سوار آية الكرسي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ec1cae11-d06f-48fc-a783-fa32f88bc6e1	2	691B46EA95817	332 مشد رجالي لتناسق الجسم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2aef53c7-f50c-40de-8370-bcd2eedcbaea	2	691B901A0FE32	جهاز تدليك الزيت بالضوء الأحمر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3063ed28-101a-409e-a587-eabf40355f97	2	691B9254766F7	قلم اللحية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
10464c31-eed7-4bb0-b786-1a1aed11a82b	2	691F185D2AA0B	lumbar spine cooling gel	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a1b44a55-8501-40d5-8230-591c8cff4385	2	6920A0C7ADE92	MINI GPS	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
6920ca7e-7cbc-4dcb-a320-8f79ffc8dcdb	2	69209FC85A061	بنك طاقة صغير محمول USB iPhone مع سلسلة مفاتيح	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8ae53175-260a-4522-9556-ec4e3a20840d	2	69209C2F476DA	جهاز طرد الحشرات بالموجات فوق الصوتية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e19c3434-3885-495a-aead-ba1efb790c20	2	6920A1645AF05	خاتم التحكم في سكر الدم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d1aed063-e353-4759-808d-86e4006cf5fb	2	6920A3650F636	دش شاور مع فلتر مدمج	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
803f0954-12e3-4b4e-8a73-f3f18a0b4810	2	6920ABF7402E5	بخاخ لإصلاح الخدوش	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ceb951bc-d341-4bdf-a3b2-a577ea277c4d	2	69231D0D4EFCC	PLAYER  شاشة سيارة محمولة و سهلة التركيب	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2ce39b2c-4710-410c-9c4d-5f8fecd3c8dc	2	6924878434C7C	شامبو ساكورا الياباني	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e5c9dfaf-926b-4a7d-9dc5-fd3755ed751c	2	692491A81DAAC	ANENG DM3004A للكشف عن المعادن حساسية عالية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
afb6886a-5776-4b5f-a7de-228c0cf0603f	2	6963B6159444F	شورت الشد المثالي للرجال black	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f2b97602-74bc-4aec-bbf6-61283a5b68a3	2	6963C3F73F521	لباس تخسيس الدهون	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3a9339af-4525-4241-bcb0-7162caeeca29	2	6980BFBDA1F2B	Airtag TRACKER جهاز تتبع	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
aa7f1de9-6bd7-4c7d-b4fa-3ce3cd3425f9	2	6980BFD0C827D	كريم ازالة الثاليل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ec3439dd-8273-440d-b89c-f798da8ca968	2	6980BFF3EBEC4	كريم راحة فورية ألم المفاصل والركبة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
6e988bed-2964-45d7-b106-464e77861037	2	6980BFDCAC023	زيت الشعر بخاخ الزنجبيل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
cd7538dc-f85a-4227-a8a6-f6bd0c59add6	2	6980BFF5EDC7B	لصقات علاج الدوالي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8bc55048-1cbf-4b17-be69-2ab666275e52	2	6980BFFC0B689	كريم الريتينول مضاد للشيخوخة moika	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0a1c3bf7-1cfe-43b4-8c08-4d799c95d8ea	2	667D78FE85743	Brella Shield	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
fafa2745-0ae3-4f1f-b571-b03420f085b0	2	6903E140D4254	المورينجا التونسية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c9a29408-b6df-4455-9ead-33be03a04366	2	6963C6FA27EDA	MINI-FAN المكيف المحمول	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
41dd707a-bdb0-47b7-a6e6-a8f293424646	2	6980BFFF8EFCC	كريم علاج البواسير	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4b84b730-9c85-4242-92cd-ccb0dac5bfe1	2	691F18E9EFC4C	disque dur 8 tb	Draft	0	0	/objects/uploads/c96fabde-63fb-46c2-826f-0229d9f567ad	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
de3d8e1e-3c19-43c8-a033-7b8a875cbd92	2	66DB07A24EFE6	قلم تضخيم اللحية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f96c41c1-2a5a-43eb-834d-a1d5fc54cff6	2	6942CB81EA89D	genger oiel	Active	0	0	\N	["15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae"]	[]	\N
5bbba7e7-fb77-428e-b890-70a8f1970cfd	2	66E837671DEB0	VR BOX	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
737c0f6f-feb5-427c-9a15-119af859eb52	2	67055E9B5F243	حزام مفصل من سي SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
32efc104-86d6-418d-8b8b-f77a418a2f2c	2	67073357F1447	كريم البروستات ys	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e9f032e5-cfc1-4dd4-85c8-a54c31d18310	2	6903DF31721E4	المصحف الناطق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c766fcdd-1ba2-4c3e-9a7f-c1b29403d9fe	2	6903E1EEC86C8	شريط لاصق مانع للتسربات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
34dc244b-8051-4930-a9de-54464019903d	2	6903E37FDF4BF	بودرة خافية لعيوب الشعر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2bc65740-2cb0-43a9-9762-79d2abd94b11	2	6903E31682182	اداة حمل الزجاج ومعالجة ضربات السيارات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2e1624e9-8d1d-464f-8909-e2cc85882aaa	2	6903E5238B42E	سوار العلاج المغناطيسي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
fb41c4d2-da14-4c0d-86d9-94bed70428f1	2	6904B4985C7B2	ملابس داخلية قابلة للتنفس (XXL)	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0989b180-cd36-4c8f-94e3-c47e87ca82ca	2	6904B50564591	ملابس داخلية قابلة للتنفس (XL)	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
40817f9c-c053-4068-ba92-d30d4df7e46a	2	690A434E6D9D9	دعامة آلام أسفل الظهر و عرق النسا	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
be018cb5-3226-4ee7-b271-48f57ffaf8a3	2	690A4635A3DEF	ماكينات الحلاقة solo trimmer	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e6553b29-62ae-4f79-94c8-1f050fc16b4c	2	6904B5586B10B	ملابس داخلية قابلة للتنفس (XXXL)	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b21b18a2-37da-4a80-b6f7-b1a74f41de70	2	691B4CC260403	جهاز الجيوب الانفية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c03d496a-9721-4c80-8924-7f8383917afa	2	691F0E43BB041	تقشير الوجه MANGO كريم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a695fc94-cf6c-47ce-b0a8-ec15ab5c9929	2	691F571BB99A4	crème Roza Relief.	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4d823c92-3ae3-483b-af07-c23f6bdb4c33	2	691F15F3C2E84	wوسادة جلوس طبية على شكل حرف	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0f3eefbf-6738-4525-985d-95595a160679	2	691F5794224BB	لاصق أو مانع تسرب	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
bb57e63e-ac7d-4f34-b747-5f1dfab5def7	2	691F57E25BE01	shampoo argan	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f77c0740-2f46-45b2-8be9-4ebe04486fcc	2	6920A5920D049	مكبر شاشة الهاتف العالمي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
920d475a-cff5-479c-a544-1f1a1979556a	2	6920A5AB09A0F	زيت اكليل الجبل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
02698892-8cc0-483b-8a07-45dc6c848d6c	2	6920A5CEA1037	نظارة قراءة عالية الجودة بدون إطار	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e4ca85a5-853e-430b-b097-69db9af2336e	2	6920ADAB37854	مصفاة أرضية مضادة للروائح - مزيلة للروائح للحمام والمرحاض	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
05a910c9-670f-486a-8099-5f57a5b90873	2	6924851A5F44C	دراجة التمرين	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0423cdf5-d94b-4fc6-ac64-f1696afe1553	2	6924AAA181A5C	فلتر التدخين	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
516d39a4-9b33-40a5-8fa9-b27deea43c5c	2	6929AB6CC605A	قرص محمول 8.5 TB	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3beee8e7-1bbf-47d4-8438-aecf421f578a	2	695AE92364646	فواهة الضغط العالي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
837bf957-5f2b-4390-90d8-4685bd7c3f4b	2	6980BFBBB7513	جهاز تتبع GPS	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0ed60c3c-cf21-4642-9fe5-3f98b42e5c6a	2	6980BFC4A8DC9	زيت مقشر أصفر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
13b97795-27c7-449b-acc2-a659d9ae1bbc	2	6980BFC610088	بذور الزهور flower seeds	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3472fc06-feae-48d0-9bb8-0c7d56a837e6	2	6980BFC80F51C	ماكنة الحلاقة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b7530360-c626-4626-9613-d40dc67a1b5b	2	6980BFDF6782D	كريم التقشير بنكهة العسل والخوخ	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d13eaeeb-cd4d-495a-9d9f-24ff0c983657	2	6980BFE46DA36	عطر سوفا ديو 100 مل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
90f95219-da35-4eed-bd3a-bd774ad6cb19	2	6980BFEE5E282	هاتف ذكي بشريحتين bleu	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4a4a60f3-0a6f-4302-8cff-df76e6e6f31d	2	6980C002CAA39	كريم إزالة الندبات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a7e3ede1-e536-4b74-b921-644a41dfe215	2	6980C004D5A55	شامبو روزماري	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3dfc41a0-28a4-44e0-876d-2824419289d7	2	6903E0B6DDA21	عطر الجذب	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3441c2e5-39c9-4107-b2b5-3c9f9f67dcfc	2	69457A27C3551	titan gel 1	Active	0	0	\N	["15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae"]	[]	\N
2049025f-a517-4b85-888e-1e172b947d58	2	6903E41F2B276	كريم البروستات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8b0df473-163b-486a-8614-1104f6ae7032	2	6980BFCCC8D45	car wax مزيل خدوش	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
889b288d-52b9-4ac5-9db2-9b49721897fa	2	66C34649BCD1F	كريم سم نحل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
479defbd-3eef-40bf-bee9-77453a905dcb	2	66D62D09D08F3	لاصقة السكر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
7520590a-dd4c-48da-a108-b594f8d1088e	2	66D9C5202938A	القرص الصلب 2 تيرا	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ee808a86-d919-4037-8095-f6ebecf5491c	2	66D9CC0766869	كريم البروستات NEW	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8334f015-18dd-40a8-b3b1-149efaf3836e	2	66E83A2E71F38	نظارات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
01416622-72c0-4b04-af76-ef7918fabbfa	2	6782630B2B3BF	Camera mini ys	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
221c0057-6de4-43fd-a4b8-3576af9347c6	2	67055D9B04F0E	حقيبة سفر ذات سعة كبيرة SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
866bbadd-c260-4c3f-b267-b037e706e174	2	68BC4E38578A4	air tag	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
acf6c933-ca7b-47df-9c7f-c52367faf4be	2	68F9E761B75CE	arabic watch	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3d921ebe-feae-486f-af18-5c7b2d353972	2	6903BBA8E27C8	ساعة ذكية لقياس السكر في الدم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b76d17ea-1092-4f4f-9968-0f96b25439a3	2	6903DFFB25EB3	النظارات الطبية القابلة للتعديل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b4a18c35-bb9a-47a1-bcf6-e33eb1c65e3e	2	6903E2536C540	مصباح الرأس مع مستشعر الحركة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
dd244b5d-c09e-42ed-ab49-6969e73a9f4a	2	6903E5B5BAB66	مقياس ضغط الدم الذكي الألماني	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
82342861-15bf-400a-99e3-8397bebde251	2	6904B9BB8BC2B	قلادة دائرية ذهبية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8ce8fc2f-93e8-41a3-a154-93dac847f906	2	6904B65D9138A	زيت 108 عشبة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
9671a934-c6cd-4397-bb97-d3cebaeed880	2	6904B8A8D3086	ليفة الاستحمام السيلكونية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8fd2fb2a-eeec-477a-b441-424ada6f9d56	2	6904BA0929A7A	كشاف شمسي مزدوج	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4b710b6d-f400-4257-aeda-63fa5d9f8135	2	6904BA85A5A6C	جهاز الكروم كاست	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
27264bda-e7a2-48f9-b85a-e14ce22b3fe6	2	6904BB659154D	كريم سم النحل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
faf5828d-fb7a-4d4e-9cf2-31fa0bdab6e7	2	691B4C471ADC6	جهاز تصحيح الشخير	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
142ef0d6-aa02-44bb-9283-22284e3e4629	2	691F2A150EEAD	جهاز الحجامة المحمول	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
410fd024-e700-40da-b992-d5ca9cb737ae	2	691F3A97A06EE	مشد الاكس لحل مشكلة انحناء الظهر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8583e48a-e88b-46ef-815a-1b4d46cdb590	2	690A46503E426	جوارب السكري	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
40bcb880-9647-422c-b247-e6377c953465	2	69209A6E3D4B7	كاميرا V-STAR الالسلكية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
09267bcf-da89-4e3c-a402-be928371686c	2	6920A57563A08	مشد الركبة الدافئة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d7218f55-4cd6-4871-98bf-cb1ea92816ac	2	6920A5BE238E5	عشبة الاسبغول للقولون	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
1e4ed317-4682-47a5-9588-08ce3ae508fc	2	6920A5D915EF6	سماعات ambie الحديثة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
118fe7b5-2cd3-4eb2-a705-345b7aeaddec	2	69231CFBC6E72	الكاشف	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
71bbf681-f966-4271-89e1-db14f3cc3667	2	6668A85771840	مكيف التبريد بالماء	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2cb8e9d6-9332-4741-895f-45f7dcfc4501	2	66D9C76B4217A	عطر رجالي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
caa97798-5c7d-4489-a1e3-9f795b5674c8	2	68825E3635CF5	نظارات تكبير خاصة بالمحترفين AYF	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
bf789326-8b4b-49c6-9691-e2f85307a834	2	6980BFC060FE7	10 Pads لاصقات مزيلة للسموم للتخلص من التعب و الاعياء	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
46e111e8-f974-447b-87b8-08ff2bf24bc9	2	691F32802B1E9	لحام حديد ايبوكسي استيل	Active	0	0	/objects/uploads/94802ed4-60f3-4b6f-919b-bfc53efd6509.mp4	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	["/objects/uploads/94802ed4-60f3-4b6f-919b-bfc53efd6509.mp4", "/objects/uploads/51352926-591d-470e-8422-4262d4468b1c.mp4", "/objects/uploads/3cc3c149-ae78-4c13-a4f5-fd41fe965448.mp4", "/objects/uploads/ab236bbd-dfb5-4209-ae4f-730af315a708.mp4", "/objects/uploads/900ed161-558f-409f-ae37-af73bd495dc2.mp4", "/objects/uploads/2eecea5e-b308-4a35-9bc4-534ec2aa21b2.mp4", "/objects/uploads/378fb230-3121-40f7-8f33-3b48e6fcc019.mp4", "/objects/uploads/0b49e060-b74d-4be9-a221-2387b6a5d7e7.mp4"]	\N
d2c6c684-4ea2-4d6c-8c17-82c7ebfac25a	2	66D852245AB8D	شاي العناية بي الكبد	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
45260d79-ae09-4abd-9e54-22e3ae4962fc	2	66C34D95A07DA	champo sakura	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b55a4ca5-2e93-4aec-9508-c870a32fbd2a	2	66D9C89ED43A5	قلادة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
909139ce-1e16-4cc2-8f54-180bab5755e0	2	66E8406A74910	علاج الدوالي و الاوردة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ae0540e1-7faa-4c50-86f5-ca75681c0932	1	m9sfdh5t	poignee cristal voiture	Active	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
832f414c-963d-4cef-94bf-16d57d464fca	1	m9sf69pg	appareils auditifs doreile	Active	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
ebb66bc9-3057-41ea-b23a-347fc8fccad9	2	6903E46F15B8C	الشيلاجيت الاصلي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
9d90c6c8-5c41-4f85-a332-a8ff3d5b0ba5	2	691F1E5A331CD	Debardeur Homme Sport Musculation	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f4dba19e-b9c5-4fdd-ab83-8824e444cc63	2	6946A4D6CA6E7	retinol cream 1	Active	0	0	\N	["15b8d102-f3fa-4a15-b7a3-1051f5ffd0ae", "8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2d0fd13b-526e-4a57-ac1f-fd1bb2436585	2	68851A02C8E5D	mini gbs yo	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
94dc1a4c-6f4b-4d9e-8d11-4f8a0491295a	2	6707DDC11FBE7	اشواغاندا	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
829c958a-cb8e-475f-a336-b05310cc7e36	2	67055C4821A78	قالب لتشكيل الاسمنت SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
14891387-66bd-4312-9e9f-2a24039f115a	2	6888DF5C6AABD	ملعقة مسطحة لتنظيف البشرة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
1e8c4ef2-b6ca-460d-84de-fab8d18098b9	2	6903BD0A2B65F	منتج إزالة رائحة الفم الكريهة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
912e5237-112c-46fd-adf4-68786f25d0d5	2	6903E2B06E1D8	جهاز قياس متعدد رقمي ذكي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d60f7157-a5cb-4a19-8a49-55f4ea2b454e	2	6903E4B2031BA	قلم اللحية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
df7d5460-7f74-4866-86c2-7978dc17e032	2	6904B6C217DB6	كريم الكولاجين	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
5d93a8d9-1caf-418b-8dc3-5b4d024ec0f2	2	690A461D854BD	معجون أسنان	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
92edf5c5-23ef-4a95-ba59-4d8370f41eb4	2	6904B94DDC926	جهاز لشد البشره الوجه	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
02cfc46a-cf05-4ab4-9681-a0de66ad8f96	2	690A4602F29F6	علاج البهاق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
26f16d86-d719-4747-8b85-c9d536c0f9a9	2	691B9060B2B1B	كريم العين إلزالة التجاعيد	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d3d3a00a-9414-4fa9-bd2e-725450908809	2	690A462C849EA	مشابك التخلص من الشخير المغناطيسية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
847d9092-b4a5-4193-a5eb-e2d3f11a2b4a	2	690A463A36937	حامي الحذاء سيليكون مقاوم للمطر و الانزلاق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
faa92f2d-53d2-45bb-a8ec-46d643a1553e	2	691F2B0A83F09	سوار التنين	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c7c53d92-9cc0-4644-a081-d26390aa9428	2	690A46700DB6E	ولاعة فريدة من نوعها مقاومة للرياح	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a62bea31-68e2-420c-93e1-4e8e2f17fe5c	2	691F3A3A33F01	سماعات بلوتوث	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
7da41096-924b-4131-ada1-c59aa5f6a2fa	1	m9sfakk9	outil pedicure elictrique	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
18394cc7-7219-4d5c-9383-b5912a4e5b0e	1	m9sfbpas	battrie rechargeable	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
7ed4e892-79ed-4a8d-b09d-9055b6bf2bb6	1	m9sf7b04	bague tasbih	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
c7cd25f1-3e3a-42b4-8efa-db8aae77a19b	1	m9sf3lwn	epillateur laser	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
03b4e1c8-4e72-4ede-9274-417f9614ce9d	1	lzr7b083	Scie à chaîne électrique	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
fea6cf1e-8965-4e3f-a50f-f7f4cabfd448	1	lzr57vmr	HUILE DE FOIE	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
504f502d-396f-4da7-bb3c-16462dc4179f	1	lz1fxt0e	FORMATION TRADING AFRIQUE	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
ab0d8d7b-bad7-4eb6-bced-64b74044ecdb	1	lvmhnpta	DETECTUER L.AU	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
8d118e03-40ec-497a-8235-84199a0049d9	1	lzcyl3im	Crème varicocèle	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
16d610fb-8898-4ee6-98c6-0bcd5d9fdc5d	2	69209884A5B84	جهاز CARPLAY	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a95c4ef9-7371-4e95-bf91-2019f88c40e2	2	6920A488E443B	Boxer Hombre Pack	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4f82aaf2-98fa-4640-b959-ee6db2c0e31f	2	6920A5D560B0A	اللاصقات المزيلة للسموم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
fcfa82ed-605f-4190-81dd-8169577ee014	2	6920A5C7E503A	جهاز تعقب مغناطيسي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4343a93f-7d4b-40e5-b37c-841dde19b7b9	2	6963B97FBDF21	Foot Bath للتحكم في السكر وتنشيط الجسم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
44e1cfcf-cfca-4b0d-aa56-fb8f928cb44b	2	6904B828B7044	منظفة السجائر المحمولة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
26e56647-ed6d-4126-9d11-dacaefdafd5c	1	lv5dsmoo	radio2	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
a4902f7a-8f38-4ba5-ba6f-f089c0258365	1	lu471gdy	IPHONE 15	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
6044124a-6a31-496a-b3c2-3163923cfe6a	1	lpfl5o9v	Prostat cosmiflix v2	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
af09cdab-eeef-465c-8971-7ae5230ab183	1	lpcx0wfs	patch liver	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
e2227bf2-2f2b-48c0-b8d5-56621d95401e	1	lpcw83iw	spray carly	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
abebcd1f-5552-46f7-84fd-1f73f314ecb6	1	ln38tq6w	Ganger poid cosmiflix	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
0459a912-0167-4254-be34-4081d01196ee	1	ln38r6d9	prostat cosmiflix	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
280d6b77-bb47-44c2-b21a-48d5c2411e02	1	ln38nl6h	Bwaser cosmiflix	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
b48a8609-56ea-4ad6-a1f9-a6591a13978c	1	lmrvht0a	PROTINE CRAEM	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
24fba90e-13fc-4f4e-af57-46297fc82dc0	1	lmey22nf	Thé soin	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
9e83a9be-71ae-4034-aa64-3b54b4ec3a50	1	llth2u5e	smille	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
7f8443b9-a400-46fc-85f4-0efe702d3d03	1	llqq19gg	Huile Essentielle	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
cedfdd09-a1dc-4cef-b753-39a845d5502a	1	lktugiaf	Pommade contre l’eczema sumifun	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
a4ee9049-6e42-4b68-b7f1-175b774c638c	1	ljzwo1vy	TOLAL	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
3334d047-b606-4d62-aafa-c8e40d605658	1	lj3cd4fw	bracelet-ecouteurs-bluetooth	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
35487be5-db0f-47b4-ab76-3426f150660f	1	l4mntv3a	Miel royal	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
7e596013-84ac-4897-8d2e-954d6bf5f895	1	l3vi5iuy	Lunettes anti radiations	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
32799e8b-51da-4080-991d-60b925fcb9bc	1	l3uonbnv	Emetteur Radio Bluetooth	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
6271a49e-6ee7-4b12-92ee-e0d5e21ec99b	1	lpmvpeva	DISQUEDUR 10TB	Active	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
c0338945-830b-497d-96fc-d995561f8201	1	l9o86ax4	Disque dur	Active	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
2a05bf0e-d085-4ed0-ba87-e7866d6e9732	2	6920ABF541C33	V ستار كام كاميرات للامن المنزلي، كاميرا مراقبة صغيرة محمولة بدقة 3 ميجابكسل، بطارية في وضع الاستعداد 100 يوم، كاميرا داخلية، تقنية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
cb1d8868-7b48-49bb-8eb1-66c4ddc28a78	2	66C34F6019711	بخاخ سم النح لجميع انواع البشرة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a8deef5b-7c9f-4a5d-b94f-f64ae4ddb5e6	2	66D6404505719	Karseell collagen - بروتين الشعر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a4613565-7a3f-4be2-ab0f-a076abd02e34	2	66E83B880526D	بخاخ علاج البواسير	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
edb80fd5-4d19-4140-92a5-7d46061f56c3	2	694578DF53EA7	Shilajit Gummies	Active	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
48ea8d52-612b-47a6-a2ee-3fc6d392f225	2	66D9CAFCD1CBF	بخاخ الرءة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8cef2a0a-1a55-455a-9c03-da054df26e0b	2	66F56F893BD5F	AIRPOID	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
1315dc77-b58e-458c-bcd7-ffc568c4def2	2	6920ABF998D5A	Lububu	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
71ac1147-1ad3-4cb7-a9eb-0bfbc0d41125	2	69248A9B6DA04	محول الطاقة للسيارات والشاحنات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
7dc84736-f285-401e-abc6-b7434dc2129d	2	692491A5225D9	نظارات قراءة رياضية متعددة البؤر ومتدرجة TR90. SA	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4eceb145-a0ff-4c0f-947b-2fc3528a8705	2	69652A8E51160	جهاز تمرين الحوض	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
bf577b9d-d04e-4d2b-adae-0798d7f75420	2	6968DC6D01B83	DR- Eau de Toilette Sixieme Sens 100ml	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3f19beb3-a976-439a-a9c3-7274bae0d0f2	2	6969087B96F34	Hair Removal silky beauty Spray for Men and Women	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
64dd3ed4-d732-45bb-91f4-8bc60d74ad51	2	696E8FF4D4E31	قلادة ذهبية + أقراط	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b69fca03-eceb-4cfb-b725-e62c930502b9	2	6980BF93327DB	مصحح إبهام القدم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
adf41e53-8f6a-45d1-b098-c4ea126b09ce	2	6980BFE77B5A0	كريم علاج البهاق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c1661536-1d02-45ce-a44c-f743ddab0da5	2	6980BFE26A459	منظف ​​الوجه الرغوي المبيض	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
61c1126d-9273-42d6-8810-c192fdb61b15	2	6980BFEB5161B	هاتف ذكي بشريحتين Black	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0781050e-8c3d-4b0c-bd6b-39f8a00be5b2	2	6980C006C8CC0	كريم دوالي الخصية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f6850179-4fde-4681-9fa8-65e4248863d4	2	6980C00955CFD	كريم علاج الألم	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e279e108-eff8-49d8-8607-82b6a7283e37	1	lpog0yof	Power Hors Naturel Cosmiflix	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
45830bb2-06a0-469b-8283-d4cd0693316f	1	lpfl6xuv	spray cosmiflix	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
cb7bbd4f-4b69-44a6-b794-dad52b197665	1	lok1s2k4	MACCA	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
d0d5d125-c93d-4dce-89fb-323566c511c9	1	lm7vk6uz	RevitalisanT DetoxiSense	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
96e12a32-48a4-48b5-949b-63c3b1c981b8	1	llqpsj2j	Patch prostate	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
f70bcfad-b9c9-4877-99e5-bb194ad8376f	1	llbsq0e2	Crème d'élimination des cicatrices guiné...	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
05161509-c8bc-470c-b8c9-db44d8b5766b	1	lky7ycyv	Mansi herb	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
93c4bf62-57bb-4ad3-839a-72b045a9a80b	1	l5pbj2sx	LANBENA- Blanchiment dentaire maison	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
f34c093f-736d-4239-9d76-8fc3447e4a72	1	l5pbiv8q	⭐⭐Hiwatch 6 T500+ PRO pour Hommes et Fem...	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
a67c27f5-451e-4df9-bd13-467ab6d0d2af	1	l0civrw1	UNISMART ORIGINAL	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
167705f9-f25e-4222-a8c2-828ec1e1badd	1		shilajit 	Active	1.1	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
7fadeca5-e4ab-466c-b8bb-cf4518920012	2	66CDC9161C9B8	كريم الوجه الريتينول	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
0020d1b4-5889-4a92-8151-518de18ce699	2	66E83877922E8	بروستات تابليت	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
92674bf9-a258-4969-9ff5-bd6a9b442ee8	2	670560F065775	SAكريم ازالة الثاليل	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
93f2e8f5-63ee-4c3c-8847-020831021d73	2	67069081318C9	ys شاي العناية بي الكبد	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2b9fe01d-bc6f-4339-ac16-110ec706c22c	2	686BEEC159825	AY علاج القولون العصبي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
a3724756-1a24-4d56-af5d-e3f83b855b27	2	67B71C284E912	SATA Converter	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f1ec1ca2-7595-4ee6-9dd6-e0bd497941fb	2	6888E121F174B	مكبر شاشة الهاتف للأفلام/الفيديوهات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
cfc342ed-1466-4ab4-a9bf-40e314169a71	2	6904B7C9EFF56	جهاز التحكم عن بعد بلوتوث للهاتف	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
647b7469-3f60-4a68-aa49-93ddd65aa24b	2	6904B76DE8410	سخان السيارات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4ea242b4-e8e3-4278-a7d0-ddcf199841e4	2	6904B70D267BB	قفازات شتوية مقاومة للماء	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c548016b-2e8c-4112-bddd-729598b90fce	2	690A451448079	نظارات شمسية ذكية وسماعات بلوتوث لاسلكية 2 في 1	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
e97ac141-c4c6-4dc8-8048-1ca7d7c1340f	2	690A463174B1D	جهاز تدليك القدمين الكهربائي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
fa1c90f7-7b11-4690-9a96-f92776bf4612	2	691B4CB3AEAD5	FAN-LAMP مروحة السقف العصرية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
2d2503f2-deea-4636-aead-623d0cdb914f	2	691F1486D88DC	game stick lite 4k 2.4g wireless	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b14be80b-30c7-4e5e-986b-00c052d20596	2	691F0ECCB001B	كريم الحكة و الاحمرار	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
3200a1c5-04a4-413d-a8ac-7186b74511bc	2	691F3F0AAA26D	ORANGE كريم إزالة الخلايا الميتة والرؤوس السوداء	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
25f1482d-8589-4ccc-afc4-9c309acd6d37	2	6920921E237ED	كريم تلميس الشعر	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
bb30c60b-3faf-4509-a392-811f1500c4b3	2	69209F2F08D09	معطر السيارة الانيق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
bd1a0b5a-5b08-462d-80ed-a88a98cbb0cc	2	6920A1A36E4ED	طلاء ايبوكسي للصلب يجف في 4 دقائق	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
c428688f-764f-4086-8329-ec313eebe767	2	69209FCAABBF0	عشبة إسبغول المعجزة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d48f65ab-f035-4bf5-89c1-0651bcb51825	2	6920A5A2B98A7	منتج البواسير	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
5da659ab-54a8-4834-8b10-d68092b8e067	2	6920A2099E7F0	مرطب الشفاه فازلين كوبل (TWG)	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
78b14c62-cc05-49aa-bc4e-8958327f668f	2	6920A5A679810	مشد الركبة المزودة	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
fc526530-0611-4955-b145-bfa362f53de2	2	6920A5AF1B6B6	منفاخ هواء محمول	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
8eb99689-0826-456b-a2d5-68f5a418de0b	2	6920A5DD83ED1	صابون القضاء على الشيب والشامبو	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
4e03c565-beb3-4917-93cf-9af18408b754	2	69665DAA9A85F	EAR قطرات طنين الأذن	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f2523d4c-fe4d-410a-9d19-5319084f1431	2	69664C9704D69	LAMP-SOL مصباح الطاقة الشمسية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
07e4ec92-d7fd-4c4e-8cf8-786956062d4d	1	lpmy7h7d	TANSYO HERB	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
8f1a610d-17d1-4907-bede-b56fb57a5774	1	lpcvxvlz	cream carly	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
77c8dc03-abcf-43df-8c13-f40d39a93a31	1	lmrum56z	SPRAY DORMIR	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
82785cd6-5c74-4d30-974c-d0e27709c3c6	1	lktu5gf5	herb prostate	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
8167e13d-bd15-402b-ba45-5b4060e032bd	1	lj63aky7	herbe tonic	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
1f1628e6-744e-472f-b20d-3194042a175e	1	l5s5rsjs	support de téléphone parfait pour vous a...	Draft	0	0	\N	["538d4fd1-8d1f-4d4d-8ea6-5a597530b2f0"]	[]	\N
aee7dfd1-ba41-492c-9f94-b290dabba2be	1	689360421F72E	قرص الصلب 2 تيرا	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
11a3ed29-b59a-411d-8ac1-41c63a8bc5f4	1	689360FD0058D	smille	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
d07a4389-f5ac-4c88-9c27-a3c8da2decc1	1	68936125A2813	بخاخ علاج البواسير	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
201e0edb-da72-4fb0-a156-3090a96c42cf	1	689361535BD3A	champo sakura	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
10577aa3-dc02-47d3-9434-bc5d65e11f99	1	6893617D9BD00	كريم علاج الدوالي	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
8ebbbd52-24cb-4667-8541-89385e3c3f1a	1	68937F4ED59FA	عضر الرجالي	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
0863fbca-bf65-4fbe-be33-dcf9c2f30791	1	689631CC17325	iphone 15	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
9b4e1b6d-d189-4bdd-b7c3-09999cf4ca7c	1	68963421A3D98	قلم التجويد للقران	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
a0a87522-eecb-45f8-a375-2d3417642abc	1	6926146FC3C06	جهاز الاكسجين	Draft	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
2d66a126-e8e7-4270-a7ed-67c679eb3d84	1	6900B96C3375E	منتوج الزراعة	Active	0	0	\N	["252d2f98-0c3d-47dc-a995-68da9599b842"]	[]	\N
4672ba0f-5702-4836-9136-c1472c80443c	2	6968DA83C958A	Eau de Toilette Sixieme Sens 30ml	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d6ad1516-f288-48e6-9944-c84fc168e8e9	2	6967A497A3C4D	النعال الطبية لآلام قوس القدم للنساء والرجال	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b4085a23-2725-42f2-b388-2bce81c761e9	2	66DB05CD0CFD9	كاشف المعادن	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
d53f4352-8b7d-440a-ba90-10e8ffa431e0	2	6903BCB253A52	بدلة الساونا	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
ce7c1358-02fc-4b09-b322-2fb30ac9582d	2	691F1F78B2BC0	wood graining rubber ms6	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
816cb8fd-687d-4b48-bca8-760b5a443b0d	2	69209FCFF2E17	مسحوق أوراق المورينجا النقي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
9ad2b54d-7c0f-487c-aab4-0e944325f8be	2	6965280F3171B	جوارب المهدئ للألم للتدفئة الذاتية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
7f058542-2769-4b4d-b3f4-d8b3c5c5d7c1	2	6980BFCE9B394	مصباح الرأس متعدد الإستخدام	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
137b0920-8eac-4ca8-a365-fbc1e0f4bda8	2	6980BFD59EAF1	كريم البروستات	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
f7162898-1268-420f-9b95-04d9c7a39fdd	2	6980BFD3C089E	كريم الأكزيما والصدفية	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
6432a658-69a2-4837-8e71-3be4b96d300f	2	6980BFF090D08	زيت الشعر الهندي أديفاسي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
cf0c81c8-3860-409c-b2cd-39d498a6519f	2	6980BFD79B789	بخاخ علاج دوالي الساقين والبطن	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
64906a47-e751-44d1-9519-ad4a083793ac	2	6980BFDAAF23C	إضاءة داخلية للسيارة LED	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
82ce81e1-bf62-47cc-a5a4-382038f3cdad	2	6980BFF8195FD	ماسك الشاي الاخضر الكوري الاصلي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
b6ac03f7-71a1-4440-9591-d83f79bd2d54	2	6980BFFDA94A7	بخاخ تنظيف الرئة العشبي	Draft	0	0	\N	["8db13ab7-c590-40a6-9f3f-321cf26b1fb1"]	[]	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
K8kErLfT4kHf6fqBUoWkKqQ7DTVYxlx2	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2026-02-13 23:59:51
tcvtUmAr7PZ_zRDHJPFOsZ1jOO4KfO6E	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2026-02-14 00:21:00
\.


--
-- Data for Name: simulations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.simulations (id, user_id, name, date, inputs, results) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, email) FROM stdin;
1	test	a6605077ae2d9392dbd68929177941e6de65bad23b706cc691f3f89d3b934920755a72c6c2718fbae5f27a9209e1e9584e83ef4e3625bac6e88c2bdcc0daa0e4.dffabb34f1e423a8d62261e08487cde0	user	\N
2	admin	378e8d52249cf7e4e0e6b3aa4d4f8e433c0c4d4eb0b4b0be3068d9c961d94a06e2150ccfcd208a20aff4829fc2a885fc5a2de0d11c7ce619ba2f3b38427a9eae.df91c2f67e23024c3ea3d6418001f687	admin	\N
\.


--
-- Name: analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analysis_id_seq', 18, true);


--
-- Name: daily_ads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_ads_id_seq', 60, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: analysis analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_pkey PRIMARY KEY (id);


--
-- Name: analysis_snapshots analysis_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_snapshots
    ADD CONSTRAINT analysis_snapshots_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: daily_ads daily_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ads
    ADD CONSTRAINT daily_ads_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: simulations simulations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simulations
    ADD CONSTRAINT simulations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: analysis_snapshots analysis_snapshots_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_snapshots
    ADD CONSTRAINT analysis_snapshots_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: analysis analysis_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: countries countries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: daily_ads daily_ads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ads
    ADD CONSTRAINT daily_ads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: products products_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: simulations simulations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simulations
    ADD CONSTRAINT simulations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict seeRQDAjtcpDmBvrqD9fsfA1LC9jUeAevEd0VRfEdkS2h6HG3E1Dy9UtLpOVNyt

