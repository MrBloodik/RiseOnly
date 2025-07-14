import "@shared/lib/global/array-extensions"

describe('Array Extensions', () => {
	describe('insert method', () => {
		it('should insert element at specified index', () => {
			const arr = [1, 2, 3, 4]
			const result = arr.insert(2, 2.5)

			expect(result).toEqual([1, 2, 2.5, 3, 4])
			expect(arr).toEqual([1, 2, 3, 4])
		})

		it('should insert element at beginning of array', () => {
			const arr = [1, 2, 3]
			const result = arr.insert(0, 0)

			expect(result).toEqual([0, 1, 2, 3])
		})

		it('should insert element at end of array', () => {
			const arr = [1, 2, 3]
			const result = arr.insert(3, 4)

			expect(result).toEqual([1, 2, 3, 4])
		})

		it('should throw error for negative index', () => {
			const arr = [1, 2, 3]

			expect(() => {
				arr.insert(-1, 99)
			}).toThrow('Index out of bounds')
		})

		it('should throw error for index greater than array length', () => {
			const arr = [1, 2, 3]

			expect(() => {
				arr.insert(4, 99)
			}).toThrow('Index out of bounds')
		})

		it('should work with mixed type arrays', () => {
			type MixedArray = (string | number)[]
			const arr: MixedArray = [1, 'two', 3]
			const result = arr.insert(1, 'inserted')

			expect(result).toEqual([1, 'inserted', 'two', 3])
		})

		it('should work with arrays of objects', () => {
			interface User {
				id: number
				name: string
			}

			const users: User[] = [
				{ id: 1, name: 'Alice' },
				{ id: 3, name: 'Charlie' }
			]

			const newUser: User = { id: 2, name: 'Bob' }
			const result = users.insert(1, newUser)

			expect(result).toEqual([
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' }
			])
		})
	})
}) 