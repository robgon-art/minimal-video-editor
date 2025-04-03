import {
    createReadOperation,
    createWriteOperation,
    createDeleteOperation,
    createListOperation,
    createCreateDirectoryOperation,
    OperationType
} from './StorageOperations';

describe('StorageOperations', () => {
    describe('createReadOperation', () => {
        it('should create a read operation with the correct type and path', () => {
            const path = '/path/to/file.txt';
            const operation = createReadOperation(path);

            expect(operation.type).toBe(OperationType.READ);
            expect(operation.path).toBe(path);
        });
    });

    describe('createWriteOperation', () => {
        it('should create a write operation with the correct type, path, and data', () => {
            const path = '/path/to/file.txt';
            const data = new ArrayBuffer(10);
            const operation = createWriteOperation(path, data);

            expect(operation.type).toBe(OperationType.WRITE);
            expect(operation.path).toBe(path);
            expect(operation.data).toBe(data);
        });
    });

    describe('createDeleteOperation', () => {
        it('should create a delete operation with the correct type and path', () => {
            const path = '/path/to/file.txt';
            const operation = createDeleteOperation(path);

            expect(operation.type).toBe(OperationType.DELETE);
            expect(operation.path).toBe(path);
        });
    });

    describe('createListOperation', () => {
        it('should create a list operation with the correct type and path', () => {
            const path = '/path/to';
            const operation = createListOperation(path);

            expect(operation.type).toBe(OperationType.LIST);
            expect(operation.path).toBe(path);
        });
    });

    describe('createCreateDirectoryOperation', () => {
        it('should create a create directory operation with the correct type and path', () => {
            const path = '/path/to/directory';
            const operation = createCreateDirectoryOperation(path);

            expect(operation.type).toBe(OperationType.CREATE_DIRECTORY);
            expect(operation.path).toBe(path);
        });
    });
}); 