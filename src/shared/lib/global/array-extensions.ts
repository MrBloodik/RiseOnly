/**
 * Расширение прототипа Array для добавления метода insert
 * Вставляет элемент в массив по указанному индексу
 */
declare global {
	interface Array<T> {
		/**
		 * Вставляет элемент в массив по указанному индексу
		 * 
		 * @param index - индекс, куда вставить элемент
		 * @param value - значение для вставки
		 * @returns новый массив с вставленным элементом (иммутабельный подход)
		 */
		insert(index: number, value: T): T[];

		/**
		 * Заменяет элемент в массиве по указанному индексу
		 * 
		 * @param index - индекс элемента, который нужно заменить
		 * @param value - новое значение для замены
		 * @returns новый массив с заменённым элементом (иммутабельный подход)
		 */
		replaceAt(index: number, value: T): T[];
	}
}

if (!Array.prototype.insert) {
	Array.prototype.insert = function <T>(index: number, value: T): T[] {
		if (index < 0 || index > this.length) {
			throw new Error('Index out of bounds');
		}

		return [
			...this.slice(0, index),
			value,
			...this.slice(index)
		];
	};
}

if (!Array.prototype.replaceAt) {
	Array.prototype.replaceAt = function <T>(index: number, value: T): T[] {
		if (index < 0 || index >= this.length) {
			throw new Error('Index out of bounds');
		}

		return [
			...this.slice(0, index),
			value,
			...this.slice(index + 1)
		];
	};
}

export { };

