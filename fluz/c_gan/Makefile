CC=gcc
CFLAGS=-Wall -O3 -lm

SRCS=gan.c tensor.c nn.c image_utils.c mnist_parser.c
OBJS=$(SRCS:.c=.o)
TARGET=gan_model

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) -o $@ $^ $(CFLAGS)

%.o: %.c
	$(CC) -c -o $@ $< $(CFLAGS)

clean:
	rm -f $(OBJS) $(TARGET)
	rm -rf images
