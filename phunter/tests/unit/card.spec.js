import { shallowMount } from '@vue/test-utils'
import ResultCard from '@/components/ResultCard.vue'

describe('ResultCard.vue', () => {
  it('renders pretty/not pretty bars', () => {
    const userId = 'fake-id';
    const imageSrc = "fake-img";
    const score = 0.5;
    const wrapper = shallowMount(ResultCard, {
      propsData: { userId: userId, imageSrc: imageSrc, score: score }
    })
    expect(wrapper.text()).toMatch(`Pretty: ${score * 100}%`);
    expect(wrapper.text()).toMatch(`Not pretty: ${score * 100}%`);
  })
})

describe('ResultCard.vue', () => {
  it('renders image base64 src', () => {
    const userId = 'fake-id';
    const imageSrc = "fake-img";
    const score = 0.5;
    const wrapper = shallowMount(ResultCard, {
      propsData: { userId: userId, imageSrc: imageSrc, score: score }
    });
    expect(wrapper.find("img").exists()).toBe(true);
    expect(wrapper.find("img").attributes("src")).toMatch(`data:image/jpeg;base64,${imageSrc}`);
  })
})
