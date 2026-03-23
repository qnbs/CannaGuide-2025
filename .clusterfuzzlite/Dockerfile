FROM gcr.io/oss-fuzz-base/base-builder-javascript@sha256:035ca1d33f5767f39bf566a6912dbd842f3860bc4c8bcedba19956be1e6efd2e

COPY . $SRC/cannaguide
WORKDIR $SRC/cannaguide
COPY .clusterfuzzlite/build.sh $SRC/
