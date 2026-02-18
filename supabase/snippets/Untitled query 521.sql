-- 1. 새 enum 타입 생성                                 
  CREATE TYPE order_status_new AS ENUM (                  
    'inquiry', 'quotation', 'work', 'settlement_wait',    
  'revenue_confirmed', 'cancelled'                        
  );                                                      
                                                          
  -- 2. 기본값 제거                                       
  ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;    
                                                          
  -- 3. 컬럼을 text로 변환                                
  ALTER TABLE orders ALTER COLUMN status TYPE text;       
  ALTER TABLE orders ALTER COLUMN cancelled_from_status   
  TYPE text;                                              
                                                          
  -- 4. 기존 데이터를 새 상태로 매핑                      
  UPDATE orders SET status = 'inquiry' WHERE status IN    
  ('inquiry', 'measurement_done');                        
  UPDATE orders SET status = 'quotation' WHERE status IN  
  ('quotation_sent', 'confirmed');                        
  UPDATE orders SET status = 'work' WHERE status IN       
  ('date_fixed', 'material_held', 'installed');           
                                                          
  -- 5. 새 enum으로 캐스팅                                
  ALTER TABLE orders ALTER COLUMN status TYPE             
  order_status_new USING status::order_status_new;        
  ALTER TABLE orders ALTER COLUMN cancelled_from_status   
  TYPE order_status_new USING                             
  cancelled_from_status::order_status_new;                
                                                          
  -- 6. 기존 enum 삭제 및 이름 변경                       
  DROP TYPE order_status;                                 
  ALTER TYPE order_status_new RENAME TO order_status;     
                                                          
  -- 7. 기본값 재설정                                     
  ALTER TABLE orders ALTER COLUMN status SET DEFAULT      
  'inquiry'::order_status;                           