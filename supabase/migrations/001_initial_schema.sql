-- Initial Schema for GoMate

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20),
  language VARCHAR(5),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  district VARCHAR(100),
  language VARCHAR(5),
  subscription_status VARCHAR(20) DEFAULT 'trial',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  razorpay_subscription_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id),
  category VARCHAR(50),
  type VARCHAR(50),
  model VARCHAR(100),
  district VARCHAR(100),
  taluka VARCHAR(100),
  price_per_day DECIMAL(10,2),
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  equipment_id UUID REFERENCES equipment(id),
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  start_date DATE,
  duration_days INTEGER,
  total_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
  phone VARCHAR(20) PRIMARY KEY,
  flow_state JSONB,
  conversation_history JSONB,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
