from faker import Faker

# fake = Faker()
fake = Faker('en_PK')

# for _ in range(5):
#     print({
#         "name": fake.name(),
#         "email": fake.email(),
#         "city": fake.city(),
#         "phone": fake.phone_number()
#     })


users = []

for _ in range(1000):
    users.append(fake.name())


print(len(users))
# for i in users:
#     print(i)